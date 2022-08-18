// const { twilioServiceLoginUrl } = require('@twilio/flex-ui/src/core/PrivateAppConfigUtils');

const { random } = require("lodash");
const TokenValidator = require('twilio-flex-token-validator').functionValidator;

exports.handler = TokenValidator(async (context, event, callback) => {

    const response = new Twilio.Response();

    response.appendHeader('Access-Control-Allow-Origin', '*');
    response.appendHeader('Access-Control-Allow-Methods', 'OPTIONS POST');
    response.appendHeader('Content-Type', 'application/json');
    response.appendHeader('Access-Control-Allow-Headers', 'Content-Type');

    const {
        taskSid,
        to,
        from
    } = event;

    // const client = context.getTwilioClient();

    const {
        ACCOUNT_SID,
        AUTH_TOKEN,
    } = context;

    snooze = ms => new Promise(resolve => setTimeout(resolve, ms));

    const addConferenceParticipant = async function (context, attempts) {

        try {

            const client = Twilio(ACCOUNT_SID, AUTH_TOKEN);
            console.log(`Adding ${to} to named conference ${taskSid}`);

            const participantsResponse = await client
                .conferences(taskSid)
                .participants
                .create({
                    to,
                    from,
                    earlyMedia: true,
                    endConferenceOnExit: false
                });

            console.log('Participant response properties:');

            Object.keys(participantsResponse).forEach(key => {
                console.log(`${key}: ${participantsResponse[key]}`);
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
                return addConferenceParticipant(context, attempts + 1);
            }
            else {
                return { success: false, message: error, status: error.response.status };
            }
        }

    }

    try {
        const result = await addConferenceParticipant(context, 0);
        const { success,message, status } = result;
        response.setStatusCode(status);
        response.setBody({ data:null, success, message });
        return callback(null, response);
    }
    catch (error) {
        console.log('Error while adding participants to conference:',error);
        response.setStatusCode(500);
        response.setBody({ data: null, message: error.message });
        return callback(null, response);

    }
    // const participantsResponse = await client
    //     .conferences(taskSid)
    //     .participants
    //     .create({
    //         to,
    //         from,
    //         earlyMedia: true,
    //         endConferenceOnExit: false
    //     });

    // console.log('Participant response properties:');

    // Object.keys(participantsResponse).forEach(key => {
    //     console.log(`${key}: ${participantsResponse[key]}`);
    // });

    return callback(null, response);

});