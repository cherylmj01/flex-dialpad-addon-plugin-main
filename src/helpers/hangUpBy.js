import TaskRouterService from '../services/TaskRouterService';
import * as Flex from "@twilio/flex-ui";

export const resetHangUpBy = (manager) => {
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

export const hasAnotherNonWorkerJoined = (task) => {
  let conference = Flex.Manager.getInstance().store.getState().flex.conferences.states[task.taskSid];
  
  if (conference) {
    const otherJoinedNonWorkers = task.conference.participants.filter(p => p.participantType !== "worker" && p.status === "joined");
    
    if (otherJoinedNonWorkers.length > 0) {
      return true;
    }
  }
  
  return false;
}

export const hasAnotherWorkerJoined = (task) => {
  if ((task.incomingTransferObject || task.outgoingTransferObject) && task.conference) {
    const otherJoinedWorkers = task.conference.participants.filter(p => p.participantType === "worker" && !p.isCurrentWorker && p.status === "joined");
    
    if (otherJoinedWorkers.length > 0) {
      return true;
    }
  }
  
  return false;
}

export const getHangUpBy = () => {
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

export const setHangUpBy = (reservationSid, value) => {
  const existingValue = getHangUpBy();
  
  const newValue = {
    ...existingValue,
    [reservationSid]: value
  };
  
  localStorage.setItem('hang_up_by', JSON.stringify(newValue));
  console.log(`Set hang_up_by for ${reservationSid} to ${value}`, newValue);
}

export const setHangUpByAttribute = async (taskSid, taskAttributes, value) => {
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

export const clearHangUpBy = (reservationSid) => {
  let storage = getHangUpBy();
  
  if (storage[reservationSid]) {
    delete storage[reservationSid];
    localStorage.setItem('hang_up_by', JSON.stringify(storage));
    console.log(`Removed hang_up_by value for ${reservationSid}`, storage);
  }
}