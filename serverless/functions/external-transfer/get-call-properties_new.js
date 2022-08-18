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
        callSid,
    } = event;

    // const client = context.getTwilioClient();
    const {
        ACCOUNT_SID,
        AUTH_TOKEN,
    } = context;

    snooze = ms => new Promise(resolve => setTimeout(resolve, ms));

    const getCallProperties = async function (context, attempts) {
        
        try {
            const client = Twilio(ACCOUNT_SID, AUTH_TOKEN);
            console.log(`Getting properties for call SID ${callSid}`);
            const callProperties = await client
            .calls(callSid)
            .fetch();

            console.log('Call properties:');

            Object.keys(callProperties).forEach(key => {
                console.log('Testing Testing',`${key}: ${callProperties[key]}`);
            });

            return {
                success: true,
                status: 200
            }
        }
        catch (error) {
            console.log('Tester Zone');
            if (error && error.response && error.response.stats == 429 && attempts < context.TWILIO_SERVICE_RETRY_LIMIT) {
                console.log('Tester time');
                const waitTime = random(context.TWILIO_SERVICE_MIN_BACKOFF, context.TWILIO_SERVICE_MAX_BACKOFF);
                await snooze(waitTime);
                return getCallProperties(context, attempts + 1);
            }
            else {
                console.log('Tester fan');
                return { success: false, message: error, status: error.response.status };
            }
        }

    }

    try {
        console.log("zzz1")
        const result = await getCallProperties(context, 0);
        console.log("zzz2", result)
        const { success,message,status } = result;
        console.log("zzz3",result)
        response.setStatusCode(status);
        console.log("zzz4")
        response.setBody({ data:null, success, message });
        console.log("zzz5")
        callback(null, response);
        console.log("zzz6")
    }
    catch (error) {
        console.log("zzz7")
        console.log('Error while getting call properties',error);
        console.log("zzz8")
        response.setStatusCode(500);
        console.log("zzz9")
        response.setBody({ data: null, message: error.message });
        console.log("zzz10")
        callback(null, response);
        console.log("zzz11")
    }

    return callback(null, response);

});