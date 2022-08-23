import { FlexPlugin } from '@twilio/flex-plugin';
import * as Flex from "@twilio/flex-ui";
import { Actions, TaskHelper } from "@twilio/flex-ui";
import reducers, { namespace } from './states';
import { Action } from './states/DirectoryState';
import CustomDirectoryContainer from "./components/CustomDirectory/CustomDirectory.Container";
import registerCustomActions from './customActions';
import registerCustomNotifications from './notifications';
import { loadExternalTransferInterface } from './components/ExternalTransfer';
import { loadInternalCallInterface } from './components/InternalCall';
import { CustomizationProvider } from "@twilio-paste/core/customization";
import { StylesProvider, createGenerateClassName, MuiThemeProvider, createTheme } from '@material-ui/core/styles';
import { ParticipantType, ReservationEvents } from './enums';
import { withTheme } from '@twilio/flex-ui';
import TaskRouterService from './services/TaskRouterService'

const PLUGIN_NAME = 'DialpadPlugin';

export default class DialpadPlugin extends FlexPlugin {
  constructor() {
    super(PLUGIN_NAME);
  }

  init(flex, manager) {
    
    const FlexThemeProvider = withTheme(({ theme, children }) => {
      return (
            <MuiThemeProvider theme={createTheme(theme)}>
                <StylesProvider generateClassName={createGenerateClassName({
                    productionPrefix: 'DialpadPlugin',
                  })}>
                    {children}
                </StylesProvider>
            </MuiThemeProvider>
      )
    });
    
    Flex.setProviders({
        CustomProvider: (RootComponent) => (props) => {
            return (
                <FlexThemeProvider>
                    <RootComponent {...props} />
                </FlexThemeProvider>
            );
        },
        PasteThemeProvider: CustomizationProvider,
    });

    const reservationListeners = new Map();
    const EXTERNAL_TRANSFER = 'External_Transfer';

    loadExternalTransferInterface.bind(this)(flex, manager)
    loadInternalCallInterface.bind(this)(flex, manager)
    this.registerReducers(manager);
    this.dispatch(Action.getDirectory());

    flex.WorkerDirectory.Tabs.Content.add(
      <flex.Tab
        key="customer-directory-container"
        label="Directory">
        <CustomDirectoryContainer key="customer-directory-container" />
      </flex.Tab>

    );
    
    flex.Actions.addListener("beforeTransferTask", (payload) => {
      // TODO: Merge this with the internal xfer logic, since it could abort the transfer.
      console.log('beforeTransferTask', payload);
      setHangUpBy(payload.sid, payload.options.mode === "COLD" ? "ColdTransfer" : "WarmTransfer");
    });
    
    flex.Actions.addListener("beforeKickParticipant", (payload) => {
      if (payload.participantType === "customer") {
        setHangUpBy(payload.sid, "Agent");
      }
    });

    flex.Actions.addListener("beforeHangupCall", (payload) => {
      console.log('beforeHangupCall', payload);
      
      const currentHangUpBy = getHangUpBy()[payload.sid];
      
      const task = TaskHelper.getTaskByTaskSid(payload.sid);
      
      if (currentHangUpBy == "WarmTransfer") {
        // Do nothing if there is another joined worker. If no other joined worker, the transfer didn't complete
        // Let's say AgentB hung up or didn't answer, but then we hang up--change it to Agent in this case.
        if (task.outgoingTransferObject && hasAnotherWorkerJoined(task)) {
          return;
        }
      } else if (task.incomingTransferObject && hasAnotherWorkerJoined(task)) {
        // If this is an incoming xfer and there is another worker in the "joined" state,
        // this worker is aborting the consult
        setHangUpBy(payload.sid, "Consult");
        return;
      }
      
      setHangUpBy(payload.sid, "Agent");
    });
    
    
    const handleReservationWrapup = async (reservation) => {
      console.log('WrapUp phase', reservation);
      const task = TaskHelper.getTaskByTaskSid(reservation.sid);
      
      let currentHangUpBy = getHangUpBy()[reservation.sid];
      
      if (currentHangUpBy !== "Consult" && task.incomingTransferObject && hasAnotherWorkerJoined(task)) {
        currentHangUpBy = "Consult";
        setHangUpBy(reservation.sid, currentHangUpBy);
      }
      
      if (!currentHangUpBy) {
        // If this worker hung up, this would have been set in beforeHangupCall or beforeKickParticipant
        // Therefore, must be customer hangup
        console.log("HangUpBy Wrapup Customer")
        currentHangUpBy = "Customer";
        setHangUpBy(reservation.sid, currentHangUpBy);
      }
      
      switch (currentHangUpBy) {
        case 'ColdTransfer':
          break;
        case 'WarmTransfer':
          // If there's no other worker but we got here, someone hung up and it wasn't us!
          if (hasAnotherWorkerJoined(task)) {
            return;
          } else {
            currentHangUpBy = "Customer";
            setHangUpBy(reservation.sid, currentHangUpBy);
            await setHangUpByAttribute(task.taskSid, task.attributes, currentHangUpBy);
          }
          // Otherwise do nothing like ColdTransfer.
          break;
        default:
          await setHangUpByAttribute(task.taskSid, task.attributes, currentHangUpBy);
      }
      
    };
    
    flex.Actions.addListener("beforeCompleteTask", async (payload) => {
      console.log('beforeCompleteTask', payload);
      const task = TaskHelper.getTaskByTaskSid(payload.sid);
      
      let currentHangUpBy = getHangUpBy()[payload.sid];
      
      if (!currentHangUpBy) {
        console.log("HangUpBy beforeCompleteTask Customer")
        currentHangUpBy = "Customer";
        setHangUpBy(payload.sid, currentHangUpBy);
      }
      
      await setHangUpByAttribute(task.taskSid, task.attributes, currentHangUpBy);
    });
    
    const handleReservationCompletion = async (reservation) => {
      console.log('Complete Task phase', reservation);
      
      let currentHangUpBy = getHangUpBy()[reservation.sid];
      
      if (currentHangUpBy && currentHangUpBy.endsWith('Transfer')) {
        // reset task attribute to Customer, as the task lives on after this transfer
        // Insights has grabbed the [Cold/Warm]Transfer value already at this point
        
        // Double-check that the customer is still here
        if (hasAnotherNonWorkerJoined(reservation)) {
          console.log("HangUpBy handleReservationCompletion Customer")
          currentHangUpBy = "Customer";
          await setHangUpByAttribute(reservation.task.sid, reservation.task.attributes, currentHangUpBy);
        }
      }
      
      // prevent ballooning of storage
      clearHangUpBy(reservation.sid);
    };
    
    const resetHangUpBy = (manager) => {
      // remove all reservations from hang_up_by that are no longer assigned
      const storageValue = getHangUpBy();
      let newValue = {};
      
      const tasks = manager.store.getState().flex.worker.tasks;
      
      tasks.forEach((_value, key) => {
        if (storageValue[key]) {
          newValue[key] = storageValue[key];
        }
      });
      
      localStorage.setItem('hang_up_by', JSON.stringify(newValue));
    }
    
    const hasAnotherNonWorkerJoined = (reservation) => {
      let conference = Flex.Manager.getInstance().store.getState().flex.conferences.states[reservation.task.sid];
      
      if (conference) {
        const otherJoinedNonWorkers = task.conference.participants.filter(p => p.participantType !== "worker" && p.status === "joined");
        
        if (otherJoinedNonWorkers.length > 0) {
          return true;
        }
      }
      
      return false;
    }
    
    const hasAnotherWorkerJoined = (task) => {
      if ((task.incomingTransferObject || task.outgoingTransferObject) && task.conference) {
        const otherJoinedWorkers = task.conference.participants.filter(p => p.participantType === "worker" && !p.isCurrentWorker && p.status === "joined");
        
        if (otherJoinedWorkers.length > 0) {
          return true;
        }
      }
      
      return false;
    }
    
    const getHangUpBy = () => {
      const storageValue = localStorage.getItem('hang_up_by');
      
      if (!storageValue) {
        return {};
      }
      
      const parsedValue = JSON.parse(storageValue);
      
      if (!parsedValue) {
        return {};
      }
      
      return parsedValue;
    }
    
    const setHangUpBy = (reservationSid, value) => {
      const existingValue = getHangUpBy();
      
      const newValue = {
        ...existingValue,
        [reservationSid]: value
      };
      
      localStorage.setItem('hang_up_by', JSON.stringify(newValue));
      console.log(`Set hang_up_by for ${reservationSid} to ${value}`, newValue);
    }
    
    const setHangUpByAttribute = async (taskSid, taskAttributes, value) => {
      if (taskAttributes && taskAttributes.conversations && taskAttributes.conversations.hang_up_by === value) {
        // no change!
        return;
      }
      
      // Temp:
      let newAttributes = {
        ...taskAttributes,
        conversations: {
          ...taskAttributes.conversations,
          hang_up_by: value
        }
      };
      
      console.log(`Setting hang_up_by attribute for ${taskSid} to ${value}`, newAttributes);
      try {
        await TaskRouterService.updateTaskAttributes(taskSid, newAttributes);
      } catch (error) {
        console.log(`Failed to set hang_up_by attribute for ${taskSid} to ${value}`, error)
      }
      //await task.setAttributes(newAttributes);
      console.log(`Finished setting hang_up_by attribute for ${taskSid} to ${value}`, newAttributes);
    }
    
    const clearHangUpBy = (reservationSid) => {
      let storage = getHangUpBy();
      
      if (storage[reservationSid]) {
        delete storage[reservationSid];
        localStorage.setItem('hang_up_by', JSON.stringify(storage));
        console.log(`Removed hang_up_by value for ${reservationSid}`, storage);
      }
    }

    const handleReservationUpdated = (event, reservation) => {
      console.debug('Event, reservation updated', event, reservation);
      switch (event) {
        case ReservationEvents.accepted:
          break;
        case ReservationEvents.wrapup: {
          console.debug('Call is in wrapup');
          handleReservationWrapup(reservation);
          break;
        }
        case ReservationEvents.completed: {
          console.debug('Call is completed');

          handleReservationCompletion(reservation);
          stopReservationListeners(reservation);
          break;
        }
        case ReservationEvents.rejected:
        case ReservationEvents.timeout:
        case ReservationEvents.canceled:
        case ReservationEvents.rescinded: {
          stopReservationListeners(reservation);
          break;
        }
        default:
          break;
      }
    };

    const stopReservationListeners = (reservation) => {
      const listeners = reservationListeners.get(reservation);
      if (listeners) {
        listeners.forEach((listener) => {
          reservation.removeListener(listener.event, listener.callback);
        });
        reservationListeners.delete(reservation);
      }
    };

    const initReservationListeners = (reservation) => {
      const trueReservation = reservation.addListener
        ? reservation
        : reservation.source;
      stopReservationListeners(trueReservation);
      const listeners = [];
      Object.values(ReservationEvents).forEach((event) => {
        const callback = () => handleReservationUpdated(event, trueReservation);
        trueReservation.addListener(event, callback);
        listeners.push({ event, callback });
      });
      reservationListeners.set(trueReservation, listeners);
    };

    const handleNewReservation = (reservation) => {
      console.debug('new reservation', reservation);
      initReservationListeners(reservation);
    };

    const handleReservationCreated = (reservation) => {
      handleNewReservation(reservation);
    };

    manager.workerClient.on('reservationCreated', (reservation) => {
      handleReservationCreated(reservation);
    });

    resetHangUpBy(manager);
    registerCustomActions(manager);
    registerCustomNotifications(flex, manager);



    // flex.Actions.addListener("CompleteTask", payload => {
    //   // add some additional logic if the external party is disconnected 

    //   // Use find for unknown
    //   // within find add aditional logic
    //   // Refer this code 
    //   //   const worker = participants.find(
    //   // (p) => p.participantType === ParticipantType.worker
    //   // );
    //   // const customer = participants.find(
    //   //   (p) => p.participantType === ParticipantType.customer
    //   // );
    //   console.log('Payload for completed task', payload);
    //   const { conference } = payload.task;
    //   if (conference.participants[2].source.status === 'joined') {
    //     console.log('hi, test was for sure successful');
    //   }
    //   if (conference.participants[2].source.status === 'joined' && conference.participants[2].source.participant_type === 'unknown') {
    //     let hang_up_by = EXTERNAL_TRANSFER;
    //     console.log('hi, test was successful');
    //   }
    // });

    // Actions.addListener("beforeTransferTask", async (payload) => {
    //   console.log('Cgerytytouy', payload);
    // });

    // flex.Actions.addListener("beforeTransferTask", payload => { 
    //   console.log('Twilio is for testing');
    // });
  }

  dispatch = (f) => Flex.Manager.getInstance().store.dispatch(f);

  registerReducers(manager) {
    if (!manager.store.addReducer) {
      // eslint-disable-next-line
      console.error(`You need FlexUI > 1.9.0 to use built-in redux; you are currently on ${VERSION}`);
      return;
    }

    manager.store.addReducer(namespace, reducers);
  }
}
