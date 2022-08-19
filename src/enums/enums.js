export const ReservationEvents = {
    accepted: 'accepted',
    rejected: 'rejected',
    timeout: 'timeout',
    canceled: 'canceled',
    rescinded: 'rescinded',
    completed: 'completed',
    wrapup: 'wrapup'
};

export const ParticipantStatus = {
    joined: 'joined',
    left: 'left'
};

export const ParticipantType = {
    customer: 'customer',
    unknown: 'unknown',
    worker: 'worker'
};

export const FlexActions = {
    acceptTask: 'AcceptTask',
    completeTask: 'CompleteTask',
    hangupCall: 'HangupCall',
    holdCall: 'HoldCall',
    holdParticipant: 'HoldParticipant',
    rejectTask: 'RejectTask',
    selectTask: 'SelectTask',
    setActivity: 'SetActivity',
    setComponentState: 'SetComponentState',
    startOutboundCall: 'StartOutboundCall',
    unholdCall: 'UnholdCall',
    unholdParticipant: 'UnholdParticipant',
    wrapupTask: 'WrapupTask',
};

export const TaskDirections = {
    inbound: 'inbound',
    outbound: 'outbound'
  };
  
  export const TaskStatus = {
    reserved: 'reserved',
    assigned: 'assigned',
    wrapping: 'wrapping',
    parked: 'parked'
  };


