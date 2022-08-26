const TokenValidator = require('twilio-flex-token-validator').functionValidator;
const ParameterValidator = require(Runtime.getFunctions()['common/parameter-validator'].path);
const ConferenceOperations = require(Runtime.getFunctions()['common/conference'].path);

exports.handler = TokenValidator(async (context, event, callback) => {

  const scriptName = arguments.callee.name;
  const response = new Twilio.Response();
  const requiredParameters = [
      { key: 'conference', purpose: 'unique ID of conference to update' },
      { key: 'participant', purpose: 'unique ID of participant to update' },
  ];
  const parameterError = ParameterValidator.validate(context.PATH, event, requiredParameters);

  response.appendHeader('Access-Control-Allow-Origin', '*');
  response.appendHeader('Access-Control-Allow-Methods', 'OPTIONS POST');
  response.appendHeader('Content-Type', 'application/json');
  response.appendHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (parameterError) {
      console.error(`${scriptName} invalid parameters passed`);
      response.setStatusCode(400);
      response.setBody({ data: null, message: parameterError });
      callback(null, response);
      return;
  }

  try {
    const {
        conference,
        participant
    } = event;
    
    const result = await ConferenceOperations.removeParticipant(
      {
        context,
        scriptName,
        conference,
        participant,
        attempts: 0
      });

    const { success, participantsResponse, status } = result;

    response.setStatusCode(status);
    response.setBody({ success, participantsResponse });
    callback(null, response);

  } catch (error) {

    console.error(`Unexpected error occurred in ${scriptName}: ${error}`);
    response.setStatusCode(500);
    response.setBody(
      { 
        success: false, 
        message: error 
      });
    callback(null, response);
  }
});
