// import { ConferenceParticipant, Manager } from '@twilio/flex-ui';
// import { fetchJsonWithReject } from '../helpers';

// class ConferenceService {
  
//     manager = Manager.getInstance();

//     serverlessDomain = process.env.REACT_APP_SERVICE_BASE_URL;

//     buildBody(encodedParams){
//         return Object.keys(encodedParams).reduce((result, paramName,idx) => {
//             if(encodedParams[paramName] === undefined) {
//                 return result;
//             }
//             if(idx > 0){
//                 return `${result}&${paramName}=${encodedParams[paramName]}`;
//             }
//             return `${paramName}=${encodedParams[paramName]}`;
//         }, '')
//     }
  
//     coldTransfer = async (callSid) => {

//         console.debug('Testing for Cheryl and Twilio');

//         const encodedParams = {
//             callSid,
//             Token: encodeURIComponent(this.manager.user.token)
//         };

//         return fetchJsonWithReject(`https://${this.serverlessDomain}/cold-transfer`,
//         {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/x-www-form-urlencoded'},
//             body: this.buildBody(encodedParams)
//         })
//         .then(resp => console.log('The response is',resp.json()))
//         .then(data => console.log('Data',data))
//         .catch(error => console.log('There is an error',error));
//     } 

// }

// export default new ConferenceService();