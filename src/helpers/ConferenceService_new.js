/* Created for use with external transfer extensions

  merged from excellent work done by Terence Rogers
  https://github.com/trogers-twilio/plugin-external-conference-warm-transfer

*/
import { ConferenceParticipant, Manager } from '@twilio/flex-ui';
import { fetchJsonWithReject } from './index';


class ConferenceService {

  manager = Manager.getInstance();

  serverlessDomain = process.env.REACT_APP_SERVICE_BASE_URL;

  buildBody(encodedParams) {
    return Object.keys(encodedParams).reduce((result, paramName, idx) => {
      if (encodedParams[paramName] === undefined) {
        return result;
      }
      if (idx > 0) {
        return `${result}&${paramName}=${encodedParams[paramName]}`;
      }
      return `${paramName}=${encodedParams[paramName]}`;
    }, '')
  }

  _toggleParticipantHold = async (conference, participantSid, hold) => {
    console.debug('Trying to hold the participants');

    return new Promise((resolve, reject) => {

      const encodedParams = {
        conference,
        participantSid,
        hold,
        Token: encodeURIComponent(this.manager.user.token)
      }

      return fetchJsonWithReject(`${this.serverlessDomain}/external-transfer/hold-conference-participant`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: this.buildBody(encodedParams)
        })
        .then(response => {
          console.log(`${hold ? 'Hold' : 'Unhold'} successful for participant`, participantSid);
          resolve(response.sid);
        })
        .catch(error => {
          console.error(`Error ${hold ? 'holding' : 'unholding'} participant ${participantSid}\r\n`, error);
          reject(error);
        })

    });

  }

  setEndConferenceOnExit = async (conference, participantSid, endConferenceOnExit) => {

    return new Promise((resolve, reject) => {

      const encodedParams = {
        conference,
        participantSid,
        endConferenceOnExit,
        Token: encodeURIComponent(this.manager.user.token)
      }

      return fetchJsonWithReject(`${this.serverlessDomain}/external-transfer/update-conference-participant`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: this.buildBody(encodedParams)
        }).then(response => {
          console.log(`Participant ${participantSid} updated:\r\n`, response);
          resolve(response.sid);
        })
        .catch(error => {
          console.error(`Error updating participant ${participantSid}\r\n`, error);
          reject(error);
        });

    });
  }

  addParticipant = async (taskSid, from, to) => {

    console.debug('Trying to add participant');

    return new Promise((resolve, reject) => {

      const encodedParams = {
        taskSid,
        from,
        to,
        Token: encodeURIComponent(this.manager.user.token)
      };

      return fetchJsonWithReject(`${this.serverlessDomain}/external-transfer/add-conference-participant`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: this.buildBody(encodedParams)
        })
        .then(response => {
          console.log('Participant added:\r\n  ', response);
          resolve(response.callSid);
        })
        .catch(error => {
          console.log('There is an error while adding participan', error);
          reject(error);
        });
    })
  }

  addConnectingParticipant = (conferenceSid, callSid, participantType) => {
    const flexState = this.manager.store.getState().flex;
    const dispatch = this.manager.store.dispatch;

    const conferenceStates = flexState.conferences.states;
    const conferences = new Set();

    console.log('Populating conferences set');
    conferenceStates.forEach(conference => {

      const currentConference = conference.source;
      console.log('Checking conference SID:', currentConference.conferenceSid);
      if (currentConference.conferenceSid !== conferenceSid) {

        console.log('Not the desired conference');
        conferences.add(currentConference);

      } else {
        const participants = currentConference.participants;
        const fakeSource = {
          connecting: true,
          participant_type: participantType,
          status: 'joined'
        };

        const fakeParticipant = new ConferenceParticipant(fakeSource, callSid);
        console.log('Adding fake participant:', fakeParticipant);
        participants.push(fakeParticipant);
        conferences.add(conference.source);

      }

    });
    console.log('Updating conferences:', conferences);
    dispatch({ type: 'CONFERENCE_MULTIPLE_UPDATE', payload: { conferences } });
  }

  holdParticipant = (conference, participantSid) => {
    return this._toggleParticipantHold(conference, participantSid, true);
  }

  unholdParticipant = (conference, participantSid) => {
    return this._toggleParticipantHold(conference, participantSid, false);
  }

  removeParticipant = (conference, participantSid) => {
    return new Promise((resolve, reject) => {

      const encodedParams = {
        conference,
        participantSid,
        Token: encodeURIComponent(this.manager.user.token)
      };

      return fetchJsonWithReject(`${this.serverlessDomain}/external-transfer/remove-conference-participant`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: this.buildBody(encodedParams)
        })
        .then(response => {
          console.log(`Participant ${participantSid} removed from conference`);
          resolve(response.callSid);
        })
        .catch(error => {
          console.error(`Error removing participant ${participantSid} from conference\r\n`, error);
          reject(error);
        });

    });
  }

  getCallProperties = async (callSid) => {

    if (callSid) {

      const encodedParams = {
        callSid,
        Token: encodeURIComponent(this.manager.user.token)
      };

      console.log('zzzy3')

      console.log('zzzy', `${this.serverlessDomain}/external-transfer/get-call-properties`)
      console.log('zzzy', this.buildBody(encodedParams))

      return fetchJsonWithReject(`${this.serverlessDomain}/external-transfer/get-call-properties`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: this.buildBody(encodedParams)
        })
        .then(resp => console.log('The call properties are', resp))
        .catch(error => console.log('There is an error', error));
    }
  }

  coldTransfer = async (callSid) => {

    console.debug('Testing for Cheryl and Twilio');

    const encodedParams = {
      callSid,
      Token: encodeURIComponent(this.manager.user.token)
    };

    return fetchJsonWithReject(`${this.serverlessDomain}/cold-transfer`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: this.buildBody(encodedParams)
      })
      .then(resp => console.log('The response is', resp.json()))
      .then(data => console.log('Data', data))
      .catch(error => console.log('There is an error', error));
  }


}

const conferenceService = new ConferenceService();

export default conferenceService;


// return new Promise((resolve, reject) => {

    //   request('external-transfer/add-conference-participant', this.manager, {
    //     taskSid,
    //     from,
    //     to
    //   }).then(response => {
    //     console.log('Participant added:\r\n  ', response);
    //     resolve(response.callSid);
    //   })
    //     .catch(error => {
    //       console.error(`Error adding participant ${to}\r\n`, error);
    //       reject(error);
    //     });

    // });

  // _toggleParticipantHold = (conference, participantSid, hold) => {
  //   return new Promise((resolve, reject) => {

  //     request('external-transfer/hold-conference-participant', this.manager, {
  //       conference,
  //       participant: participantSid,
  //       hold
  //     }).then(response => {
  //       console.log(`${hold ? 'Hold' : 'Unhold'} successful for participant`, participantSid);
  //       resolve();
  //     }).catch(error => {
  //       console.error(`Error ${hold ? 'holding' : 'unholding'} participant ${participantSid}\r\n`, error);
  //       reject(error);
  //     })
  //   })
  // }