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
import { ParticipantType, ReservationEvents } from './enums'

const PLUGIN_NAME = 'DialpadPlugin';

export default class DialpadPlugin extends FlexPlugin {
  constructor() {
    super(PLUGIN_NAME);
  }

  init(flex, manager) {

    const reservationListeners = new Map();
    const EXTERNAL_TRANSFER = 'External_Transfer';
    let hangUpBy;

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

    flex.Actions.addListener("beforeHangupCall", (payload) => {
      console.log('Testing for this');
      console.log('Hang up is by', payload);
      console.log('Payload sid is',payload.sid)
      const agent = "agent";
      const sid = payload.sid;
      const reservation_hang_up_value = {
        sid: agent
      }
      localStorage.setItem('hang_up_by', JSON.stringify(reservation_hang_up_value));
    });

    flex.Actions.addListener("beforeCompleteTask", (payload) => {
      console.log('Value for payload after task completed is',payload.task.attributes.hang_up_by);
      // if(payload.task.attributes.hang_up_by != "agent"){

      // }
    });


    const handleReservationWrapup = async (reservation) => {
      console.log('WrapUp phase');
      const task = TaskHelper.getTaskByTaskSid(reservation.sid);
      const { attributes } = task;
      let newAttributes;
      console.log('Task details are',task);
      const { participants } = task.conference
      const customer = participants.find(p => p.participantType === "customer");
      console.log('The customer has:', customer.status);

      // console.log('participant details are ',participants);
      // console.log('participant details are ',customer);

      // check local storage for hang_up_by value
      const local_storage_hang_up_by_value = localStorage.getItem('hang_up_by');
      console.log('Local storage value is', local_storage_hang_up_by_value);

      // if the value exists and the participants array has both the customer and the agent
      // then assign hang_up_by = 'agent'
      if (local_storage_hang_up_by_value) {
        console.log('We have value', reservation);
        hangUpBy = local_storage_hang_up_by_value;
        newAttributes = {
          ...attributes,
          hang_up_by: hangUpBy
        };
        
      } 
      
      await task.setAttributes(newAttributes);
    };

    const handleReservationCompletion = async (reservation) => {
      console.log('Complete Task phase');
    };

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
