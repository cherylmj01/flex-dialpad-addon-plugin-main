import * as HangUpByHelper from '../../helpers/hangUpBy';
import { TaskHelper } from "@twilio/flex-ui";
import { HangUpBy } from '../../enums';

export const beforeTransferTask = (payload) => {
  // TODO: Merge this with the internal xfer logic, since it could abort the transfer.
  console.log('beforeTransferTask', payload);
  HangUpByHelper.setHangUpBy(payload.sid, payload.options.mode === "COLD" ? HangUpBy.ColdTransfer : HangUpBy.WarmTransfer);
}

export const beforeKickParticipant = (payload) => {
  if (payload.participantType === "customer") {
    HangUpByHelper.setHangUpBy(payload.sid,  HangUpBy.Agent);
  }
}

export const beforeHangupCall = (payload) => {
  console.log('beforeHangupCall', payload);
  
  const currentHangUpBy = HangUpByHelper.getHangUpBy()[payload.sid];
  
  const task = TaskHelper.getTaskByTaskSid(payload.sid);
  
  if (currentHangUpBy == HangUpBy.ExternalWarmTransfer) {
    if (!HangUpByHelper.hasExternalJoined(task)) {
      // No external participant here, so the xfer must've aborted.
      HangUpByHelper.setHangUpBy(payload.sid, HangUpBy.Agent);
    } else if (!HangUpByHelper.hasCustomerJoined(task)) {
      // No customer here, so they must've left early!
      HangUpByHelper.setHangUpBy(payload.sid, HangUpBy.Customer);
    }
    
    // don't change it otherwise
    
    return;
  }
  
  if (currentHangUpBy == HangUpBy.WarmTransfer) {
    // Do nothing if there is another joined worker. If no other joined worker, the transfer didn't complete
    // Let's say AgentB hung up or didn't answer, but then we hang up--change it to Agent in this case.
    if (task.outgoingTransferObject && HangUpByHelper.hasAnotherWorkerJoined(task)) {
      return;
    }
  } else if (task.incomingTransferObject && HangUpByHelper.hasAnotherWorkerJoined(task)) {
    // If this is an incoming xfer and there is another worker in the "joined" state,
    // this worker is aborting the consult
    HangUpByHelper.setHangUpBy(payload.sid, HangUpBy.Consult);
    return;
  }
  
  HangUpByHelper.setHangUpBy(payload.sid, HangUpBy.Agent);
}

export const beforeCompleteTask = async (payload) => {
  console.log('beforeCompleteTask', payload);
  const task = TaskHelper.getTaskByTaskSid(payload.sid);
  
  let currentHangUpBy = HangUpByHelper.getHangUpBy()[payload.sid];
  
  if (!currentHangUpBy) {
    currentHangUpBy = HangUpBy.Customer;
    HangUpByHelper.setHangUpBy(payload.sid, currentHangUpBy);
  }
  
  await HangUpByHelper.setHangUpByAttribute(task.taskSid, task.attributes, currentHangUpBy);
}

export const CustomExternalTransferTask = async (payload) => {
  let newHangUpBy;
  let { task, mode, to } = payload;
  
  if (mode == 'COLD') {
    newHangUpBy = HangUpBy.ExternalColdTransfer;
  } else if (mode == 'WARM') {
    newHangUpBy = HangUpBy.ExternalWarmTransfer;
  }
  
  HangUpByHelper.setHangUpBy(task.sid, newHangUpBy);
  await HangUpByHelper.setHangUpByAttribute(task.taskSid, task.attributes, newHangUpBy, to);
}