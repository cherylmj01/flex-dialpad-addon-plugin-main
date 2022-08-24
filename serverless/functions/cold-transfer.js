const { random } = require("lodash");
const TokenValidator = require('twilio-flex-token-validator').functionValidator;

exports.handler = TokenValidator(async (context, event, callback) => {
 // make sure this function gets the to number and the callSid
  
  const response = new Twilio.Response();

  response.appendHeader('Access-Control-Allow-Origin', '*');
  response.appendHeader('Access-Control-Allow-Methods', 'OPTIONS POST');
  response.appendHeader('Content-Type', 'application/json');
  response.appendHeader('Access-Control-Allow-Headers', 'Content-Type');

  const {
        ACCOUNT_SID,
        AUTH_TOKEN,
    } = context;

  const {
    callSid,
    to
  } = event;

  snooze = ms => new Promise(resolve => setTimeout(resolve, ms));

  const setTwimlVoice = async function (context, attempts) {

    try{
      const client = Twilio(ACCOUNT_SID, AUTH_TOKEN);
      console.log(`Updating call ${callSid} with twiml`);

      await client
      .calls(callSid)
      .update({
        twiml: `<Response><Dial>${to}</Dial></Response>`
      }).then(call => console.log(call.to));

      return { 
        success: true, 
        status: 200 
      }

    }
    catch (error) {
      
      if(error && error.response && error.response.stats == 429 && attempts < context.TWILIO_SERVICE_RETRY_LIMIT ){
        const waitTime = random(context.TWILIO_SERVICE_MIN_BACKOFF, context.TWILIO_SERVICE_MAX_BACKOFF);
        await snooze(waitTime);
        return setTwimlVoice(context, attempts + 1);
      }
      else {
        return { success: false, message: error, status: error.response.status };
      }

    }
  }

  try {

    const result = await setTwimlVoice(context, 0);
    const { success, message, status } = result;
    response.setStatusCode(status);
    response.setBody({ data:null, success, message });
    callback(null, response);

  }
  catch (error) {

    console.log('Error while updating twiml:',error);
    response.setStatusCode(500);
    response.setBody({ data: null, message: error.message });
    callback(null, response);
  }

  return callback(null, response);
});