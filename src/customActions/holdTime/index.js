import { holdTime as HoldTimeHelper } from '../../helpers';

export const beforeHoldCall = async (payload) => {
  await HoldTimeHelper.startHold(payload.sid);
}

export const beforeUnholdCall = async (payload) => {
  await HoldTimeHelper.endHold(payload.sid);
}

export const beforeTransferTask = async (payload) => {
  if (payload.options.mode === "WARM") {
    await HoldTimeHelper.startHold(payload.sid);
  }
}