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

export const HangUpBy = {
    Customer: 'Customer',
    Agent: 'Agent',
    Consult: 'Consult',
    ColdTransfer: 'ColdTransfer',
    WarmTransfer: 'WarmTransfer',
    ExternalColdTransfer: 'ExternalColdTransfer',
    ExternalWarmTransfer: 'ExternalWarmTransfer'
};