import * as HangUpByEvents from './hangUpBy';
import * as HoldTimeEvents from './holdTime';

export default (manager) => {
  manager.events.addListener("taskWrapup", async (task) => {
    await HangUpByEvents.taskWrapup(task);
    await HoldTimeEvents.taskWrapup(task);
  });
  
  manager.events.addListener("taskCompleted", async (task) => {
    await HangUpByEvents.taskCompleted(task);
  });
}