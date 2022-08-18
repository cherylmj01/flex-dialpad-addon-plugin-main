const TokenValidator = require('twilio-flex-token-validator').functionValidator;
const { random } = require("lodash");

// let path = Runtime.getFunctions()['dialpad-utils'].path;
// let assets = require(path);

exports.handler = TokenValidator(async (context, event, callback) => {

  const response = new Twilio.Response();

  response.appendHeader('Access-Control-Allow-Origin', '*');
  response.appendHeader('Access-Control-Allow-Methods', 'OPTIONS POST');
  response.appendHeader('Content-Type', 'application/json');
  response.appendHeader('Access-Control-Allow-Headers', 'Content-Type');

  const {
    conference,
    participant,
    endConferenceOnExit
  } = event;

  const {
    ACCOUNT_SID,
    AUTH_TOKEN,
  } = context;

  snooze = ms => new Promise(resolve => setTimeout(resolve, ms));

  const updateConferenceParticipant = async function (context, attempts) {
    try {
      const client = Twilio(ACCOUNT_SID, AUTH_TOKEN);
      console.log(`Updating participant ${participant} in conference ${conference}`);
      // const client = context.getTwilioClient();

      const participantResponse = await client
        .conferences(conference)
        .participants(participant)
        .update({
          endConferenceOnExit
        }).catch(e => {
          console.error(e);
          return {};
        });

      console.log('Participant response properties:');

      Object.keys(participantResponse).forEach(key => {
        console.log(`${key}: ${participantResponse[key]}`);
      });

      return {
        success: true,
        status: 200
      }

    }
    catch (error) {
      if (error && error.response && error.response.stats == 429 && attempts < context.TWILIO_SERVICE_RETRY_LIMIT) {
        const waitTime = random(context.TWILIO_SERVICE_MIN_BACKOFF, context.TWILIO_SERVICE_MAX_BACKOFF);
        await snooze(waitTime);
        return updateConferenceParticipant(context, attempts + 1);
      }
      else {
        return { success: false, message: error, status: error.response.status };
      }

    }
  }

  try {
    const result = await updateConferenceParticipant(context, 0);
    const { success,message, status } = result;
    response.setStatusCode(status);
    response.setBody({ data:null, success, message });
    callback(null, response);
  }
  catch (error) {
    console.log('Error while updating participants in conference:',error);
    response.setStatusCode(500);
    response.setBody({ data: null, message: error.message });
    callback(null, response);
  }

  return callback(null, response);
  // return callback(null, assets.response("json", participantResponse));
});