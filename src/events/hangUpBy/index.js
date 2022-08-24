import * as HangUpByHelper from '../../helpers/hangUpBy';
import { HangUpBy } from '../../enums';

export const taskWrapup = async (task) => {
  console.log('WrapUp phase', task);
  
  let currentHangUpBy = HangUpByHelper.getHangUpBy()[task.sid];
  
  if (currentHangUpBy !== HangUpBy.Consult && task.incomingTransferObject && HangUpByHelper.hasAnotherWorkerJoined(task)) {
    currentHangUpBy = HangUpBy.Consult;
    HangUpByHelper.setHangUpBy(task.sid, currentHangUpBy);
  }
  
  if (!currentHangUpBy) {
    // If this worker hung up, this would have been set in beforeHangupCall or beforeKickParticipant
    // Therefore, must be customer hangup
    console.log("HangUpBy Wrapup Customer")
    currentHangUpBy = HangUpBy.Customer;
    HangUpByHelper.setHangUpBy(task.sid, currentHangUpBy);
  }
  
  switch (currentHangUpBy) {
    case HangUpBy.ColdTransfer:
      break;
    case HangUpBy.WarmTransfer:
      // If there's no other worker but we got here, someone hung up and it wasn't us!
      if (HangUpByHelper.hasAnotherWorkerJoined(task)) {
        return;
      } else {
        currentHangUpBy = HangUpBy.Customer;
        HangUpByHelper.setHangUpBy(task.sid, currentHangUpBy);
        await HangUpByHelper.setHangUpByAttribute(task.taskSid, task.attributes, currentHangUpBy);
      }
      // Otherwise do nothing like ColdTransfer.
      break;
    default:
      await HangUpByHelper.setHangUpByAttribute(task.taskSid, task.attributes, currentHangUpBy);
  }
}

export const taskCompleted = async (task) => {
  console.log('Complete Task phase', task);
  
  let currentHangUpBy = HangUpByHelper.getHangUpBy()[task.sid];
  
  if (currentHangUpBy && currentHangUpBy.endsWith('Transfer')) {
    // reset task attribute to Customer, as the task lives on after this transfer
    // Insights has grabbed the [Cold/Warm]Transfer value already at this point
    
    // Double-check that the customer is still here
    if (HangUpByHelper.hasAnotherNonWorkerJoined(task)) {
      console.log("HangUpBy handleReservationCompletion Customer")
      currentHangUpBy = HangUpBy.Customer;
      await HangUpByHelper.setHangUpByAttribute(task.taskSid, task.attributes, currentHangUpBy);
    }
  }
  
  // prevent ballooning of storage
  HangUpByHelper.clearHangUpBy(task.sid);
}