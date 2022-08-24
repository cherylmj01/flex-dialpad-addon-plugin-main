import * as HangUpByEvents from './hangUpBy';

export default (manager) => {
  manager.events.addListener("taskWrapup", async (task) => {
    await HangUpByEvents.taskWrapup(task);
  });
  
  manager.events.addListener("taskCompleted", async (task) => {
    await HangUpByEvents.taskCompleted(task);
  });
}