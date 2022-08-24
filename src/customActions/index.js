import { Actions, Notifications, StateHelper } from '@twilio/flex-ui';
import { acceptInternalTask, rejectInternalTask, isInternalCall, holdCall } from './internalCall';
import * as ExternalTransferActions from './externalTransfer';
import * as HangUpByActions from './hangUpBy';
import ConferenceService from '../helpers/ConferenceService';
import { CustomNotifications } from '../notifications';

export default (manager) => {

  Actions.addListener('beforeAcceptTask', (payload, abortFunction) => {
    const reservation = payload.task.sourceObject;

    if (isInternalCall(payload)) {
      abortFunction();
      acceptInternalTask({ reservation, payload });
    }
  });

  Actions.addListener('beforeRejectTask', (payload, abortFunction) => {
    if (isInternalCall(payload)) {
      abortFunction();
      rejectInternalTask({ manager, payload });
    }
  });

  Actions.addListener('beforeHoldCall', (payload) => {
    return holdCall(payload, true)
  });

  Actions.addListener('beforeUnholdCall', (payload) => {
    return holdCall(payload, false)
  });

  Actions.addListener('beforeHoldParticipant', (payload, abortFunction) => {
    const { participantType, targetSid: participantSid, task } = payload;

    if (participantType !== 'unknown') {
      return;
    }

    const { conferenceSid } = task.conference;
    abortFunction();
    console.log('Holding participant', participantSid);
    return ConferenceService.holdParticipant(conferenceSid, participantSid);
  });

  Actions.addListener('beforeUnholdParticipant', (payload, abortFunction) => {
    const { participantType, targetSid: participantSid, task } = payload;

    if (participantType !== 'unknown') {
      return;
    }

    console.log('Holding participant', participantSid);

    const { conferenceSid } = task.conference;
    abortFunction();
    return ConferenceService.unholdParticipant(conferenceSid, participantSid);
  });

  Actions.addListener('beforeKickParticipant', (payload, abortFunction) => {
    const { participantType } = payload;

    if (
      participantType !== "transfer" &&
      participantType !== 'worker'
    ) {
      abortFunction();
      ExternalTransferActions.kickExternalTransferParticipant(payload);
    }
    
    HangUpByActions.beforeKickParticipant(payload);
  });

  Actions.addListener('beforeHangupCall', async (payload, abortFunction) => {
    const { conference, taskSid } = payload.task;
    const participantsOnHold = (participant) => {
      return participant.onHold && participant.status === "joined";
    };
    const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));
    const getLatestConference = taskSid => {
      const updatedTask = StateHelper.getTaskByTaskrouterTaskSid(taskSid)
      return updatedTask.conference
    }

    // check if worker hanging up is last worker on the call
    if (conference && conference.liveWorkerCount === 1) {

      //if so, ensure no other participants are on hold as 
      //no external parties will be able to remove them from being on hold.
      conference.participants.forEach(async (participant) => {
        const { participantType, workerSid, callSid } = participant;
        if (participant.onHold && participant.status === "joined") {
          await Actions.invokeAction("UnholdParticipant", {
            participantType,
            task: payload.task,
            targetSid: participantType === 'worker' ? workerSid : callSid
          });
        }
      });

      // make sure this operation blocks hanging up the call until 
      // all participants are taken off hold or max wait time is reached
      let attempts = 0;
      let updatedConference = getLatestConference(taskSid);
      let { participants } = updatedConference;
      while (participants.some(participantsOnHold) && attempts < 10) {
        await snooze(500);
        attempts++;
        updatedConference = getLatestConference(taskSid);
        participants = updatedConference.participants;
      }

      // if some participants are still on hold, abort hanging up the call
      if (updatedConference.participants.some(participantsOnHold)) {
        Notifications.showNotification(CustomNotifications.FailedHangupNotification);
        abortFunction();
        return;
      }
    }
    
    HangUpByActions.beforeHangupCall(payload);
  });
  
  Actions.addListener("beforeTransferTask", (payload) => {
    HangUpByActions.beforeTransferTask(payload);
  });
  
  Actions.addListener("beforeCompleteTask", async (payload) => {
    await HangUpByActions.beforeCompleteTask(payload);
  });
  
  Actions.registerAction("CustomExternalTransferTask", (payload) => {
     /* payload schema:
     {
       task: ITask,
       mode: COLD | WARM,
       to: string,
       from: string
     }
     */
     
     if (payload.mode == 'COLD') {
       ExternalTransferActions.doColdTransfer(payload);
     } else if (payload.mode == 'WARM') {
       ExternalTransferActions.doWarmTransfer(payload);
     }
  });
}