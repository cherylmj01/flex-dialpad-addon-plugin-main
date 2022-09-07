import { hangUpBy as HangUpByHelper } from '../../helpers';
import { HangUpBy } from '../../enums';
import { holdTime as HoldTimeHelper } from '../../helpers';
import SyncClient from "../../services/SyncClient";

export const taskWrapup = async (task) => {
  const key = `${task.sid}_HoldTime`;
  
  const doc = await SyncClient.getSyncDoc(key);
  let { data } = doc;
  
  if (!data.holdTime) {
    // no holds
    data.holdTime = 0;
  }
  
  if (data.currentHoldStart && data.currentHoldStart > 0) {
    // hold in progress
    
    let currentHangUpBy = HangUpByHelper.getHangUpBy()[task.sid];
    
    switch (currentHangUpBy) {
      case HangUpBy.ColdTransfer:
      case HangUpBy.WarmTransfer:
        // skip saving transfer-initiated hold time
        // external transfers do not auto-hold
        // update sync doc so that wrapup service doesn't catch it
        data = await HoldTimeHelper.updateHoldTime(reservationSid, data.holdTime);
        break;
      default:
        // add the current hold time
        data = await HoldTimeHelper.endHold(task.sid);
    }
  }
  
  await HoldTimeHelper.writeHoldData(task.taskSid, data.holdTime);
  await SyncClient.closeSyncDoc();
  console.log(`Saved hold time for ${task.sid}`, data);
}

export const taskCompleted = async (task) => {
  let currentHangUpBy = HangUpByHelper.getHangUpBy()[task.sid];
  
  if ((currentHangUpBy === HangUpBy.ColdTransfer || currentHangUpBy === HangUpBy.WarmTransfer) && task && task.attributes && task.attributes.conversations && task.attributes.conversations.hold_time && task.attributes.conversations.hold_time > 0) {
    // reset hold time for the next segment
    await HoldTimeHelper.writeHoldData(task.taskSid, 0);
  }
}