import * as HangUpByHelper from '../../helpers/hangUpBy';
import { HangUpBy } from '../../enums';

export const taskWrapup = async (task) => {
  console.log('taskWrapup', task);
  
  let currentHangUpBy = HangUpByHelper.getHangUpBy()[task.sid];
  
  if (currentHangUpBy !== HangUpBy.Consult && task.incomingTransferObject && HangUpByHelper.hasAnotherWorkerJoined(task)) {
    currentHangUpBy = HangUpBy.Consult;
    HangUpByHelper.setHangUpBy(task.sid, currentHangUpBy);
  }
  
  if (!currentHangUpBy) {
    // If this worker hung up, this would have been set in beforeHangupCall or beforeKickParticipant
    // Therefore, must be customer hangup
    currentHangUpBy = HangUpBy.Customer;
    HangUpByHelper.setHangUpBy(task.sid, currentHangUpBy);
  }
  
  switch (currentHangUpBy) {
    case HangUpBy.ColdTransfer:
    case HangUpBy.ExternalColdTransfer:
      break;
    case HangUpBy.ExternalWarmTransfer:
      // If there's no customer at this point, they hung up on us
      if (!HangUpByHelper.hasCustomerJoined(task)) {
        currentHangUpBy = HangUpBy.Customer;
        HangUpByHelper.setHangUpBy(task.sid, currentHangUpBy);
        await HangUpByHelper.setHangUpByAttribute(task.taskSid, task.attributes, currentHangUpBy);
      }
      break;
    case HangUpBy.WarmTransfer:
      // If there's no other worker but we got here, someone hung up and it wasn't us!
      if (!HangUpByHelper.hasAnotherWorkerJoined(task)) {
        currentHangUpBy = HangUpBy.Customer;
        HangUpByHelper.setHangUpBy(task.sid, currentHangUpBy);
        await HangUpByHelper.setHangUpByAttribute(task.taskSid, task.attributes, currentHangUpBy);
      }
      break;
    default:
      await HangUpByHelper.setHangUpByAttribute(task.taskSid, task.attributes, currentHangUpBy);
  }
}

export const taskCompleted = async (task) => {
  console.log('taskCompleted', task);
  
  let currentHangUpBy = HangUpByHelper.getHangUpBy()[task.sid];
  
  if (currentHangUpBy === HangUpBy.ColdTransfer || currentHangUpBy === HangUpBy.WarmTransfer) {
    // reset task attribute to Customer, as the task lives on after this transfer
    // Insights has grabbed the [Cold/Warm]Transfer value already at this point
    
    // Double-check that the customer is still here
    if (HangUpByHelper.hasAnotherNonWorkerJoined(task)) {
      currentHangUpBy = HangUpBy.Customer;
      await HangUpByHelper.setHangUpByAttribute(task.taskSid, task.attributes, currentHangUpBy);
    }
  }
  
  // prevent ballooning of storage
  HangUpByHelper.clearHangUpBy(task.sid);
}