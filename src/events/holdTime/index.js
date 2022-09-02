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
        break;
      default:
        // add the current hold time
        data = await HoldTimeHelper.endHold(task.sid);
    }
  }
  
  await HoldTimeHelper.writeHoldData(task.taskSid, data);
  await SyncClient.closeSyncDoc();
  console.log(`Saved hold time for ${task.sid}`, data);
}