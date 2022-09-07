import SyncClient from "../services/SyncClient";
import TaskRouterService from '../services/TaskRouterService';

/*
Sync Doc format:
{
  currentHoldStart: Date,
  holdTime: Number
}
*/

export const startHold = async (reservationSid) => {
  const key = `${reservationSid}_HoldTime`;
  
  const doc = await SyncClient.getSyncDoc(key);
  let { data } = doc;
  
  if (isNaN(data.holdTime)) {
    data.holdTime = 0;
  }
  
  data.currentHoldStart = Date.now();
  
  const updated = await SyncClient.updateSyncDoc(key, data);
  return updated;
}

export const endHold = async (reservationSid) => {
  const key = `${reservationSid}_HoldTime`;
  
  const doc = await SyncClient.getSyncDoc(key);
  let { data } = doc;
  
  if (isNaN(data.currentHoldStart) || data.currentHoldStart === 0) {
    // we never started tracking hold-abandon ship!
    return;
  }
  
  const currentHoldEnd = Date.now();
  const currentHoldDuration = (currentHoldEnd - data.currentHoldStart) / 1000;
  
  const newHoldDuration = data.holdTime + currentHoldDuration;
  
  const updated = await updateHoldTime(reservationSid, newHoldDuration);
  return updated;
}

export const updateHoldTime = async (reservationSid, newHoldDuration) => {
  const key = `${reservationSid}_HoldTime`;
  
  const newData = {
    currentHoldStart: 0,
    holdTime: newHoldDuration
  };
  
  const updated = await SyncClient.updateSyncDoc(key, newData);
  return updated;
}

export const writeHoldData = async (taskSid, holdTime) => {
  const newAttributes = {
    conversations: {
      hold_time: holdTime
    }
  }
  
  await TaskRouterService.updateTaskAttributes(taskSid, newAttributes);
}