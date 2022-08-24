import ConferenceService from '../../helpers/ConferenceService';

export const kickExternalTransferParticipant = (payload) => {
    const { task, targetSid } = payload;

    const conference = task.attributes.conference ? 
        task.attributes.conference.sid : 
        task.conference.conferenceSid;

    const participantSid = targetSid;

    console.log(`Removing participant ${participantSid} from conference`);
    return ConferenceService.removeParticipant(conference, participantSid);
}

export const doColdTransfer = async (payload) => {
    const { task, to } = payload;
    const callSid = task.attributes.call_sid;
    try {
        await ConferenceService.coldTransfer(callSid, to);
    }
    catch(error){
        console.error('Error while doing Cold Transfer:', error);
    }
}

export const doWarmTransfer = async (payload) => {
    const { task, to, from } = payload;
    const conference = task && (task.conference || {});
    const { conferenceSid } = conference;
    
    const mainConferenceSid = task.attributes.conference ? 
    task.attributes.conference.sid : conferenceSid;
    
    console.log(`Adding ${to} to conference`);
    
    let participantCallSid;
    
    try {
        participantCallSid = await ConferenceService.addParticipant(mainConferenceSid, from, to);
        ConferenceService.addConnectingParticipant(mainConferenceSid, participantCallSid, 'unknown');
    }
    catch(error){
        console.error('Error adding conference participant:', error);
    }
}