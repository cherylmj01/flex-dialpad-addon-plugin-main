# Flex Agent Addons Plugin
# Notes
This plugin was upgraded to the latest version of the Plugin Builder (v4), now part of the Twilio CLI.
See: https://www.twilio.com/docs/flex/developer/plugins/migrate

The native Flex Dialpad does not support agent-to-agent direct calls or external transfers yet. This plugin is meant to be an add-on to the native Flex Diapad, adding both agent-to-agent direct calls and external transfers.

## Flex plugin

A Twilio Flex Plugin allow you to customize the appearance and behavior of [Twilio Flex](https://www.twilio.com/flex). If you want to learn more about the capabilities and how to use the API, check out our [Flex documentation](https://www.twilio.com/docs/flex).

## Features

### Custom directory

When in a call, a new "Directory" tab is added to the transfer panel to allow cold transfers (and optionally warm transfers) to custom defined contacts. Both warm and cold transfers from the directory are accomplished by calling Twilio Functions to perform the required Twilio API requests. The directory's contents are loaded via a directory JSON file. Here is an example file:

```
[
  {
    "id" : "1",
    "name": "Weather Phone",
    "phone": "+13172222222",
    "enableWarmTransfer": "true"
  },
  {
    "id": "2",
    "name": "Twilio",
    "phone": "+18448144627"
  }
]
```

The `enableWarmTransfer` property can be set on each contact to control whether warm transfers are allowed for that contact.

### External transfer

When in a call, a "plus" icon is added to the Call Canvas where you can add a external number to the call. This action executes a Twilio Function that uses the Twilio API to make a call and add this call to the current conference. In the Flex UI side, the participant is added manually and both hold/unhold and hangup buttons are available.   

This feature is based on the work on this [project](https://github.com/twilio-labs/plugin-flex-outbound-dialpad).

### Hang up by

This feature writes to the `conversations.hang_up_by` task attribute to allow reporting within Flex Insights on which party ended a call. This is accomplished by adding various Flex UI action and event listeners to deduce the reason for the conversation ending.

For external transfers, this also writes the `conversations.destination` task attribute to allow reporting on the phone numbers customers are being transferred to.

The following values may be set for hang up by:
- Customer
- Agent
- Consult _(a consulting agent left the call before a warm transfer completed)_
- Cold Transfer
- Warm Transfer
- External Cold Transfer
- External Warm Transfer

### Hold time

This feature writes the `conversations.hold_time` task attribute to override the hold time calculated by Insights. This allows excluding [automatic hold times caused by warm transfers](https://www.twilio.com/docs/flex/end-user-guide/insights/metrics/hold-time#conversations-with-transfers-and-conferences), which cause misleading hold time reporting.

### Internal transfer add-ons

These features are documented [here](https://github.com/trogers-twilio/flex-internal-transfer-addons).

# Configuration

## Flex Plugin

This repository is a Flex plugin with some other assets. The following describing how you setup, develop and deploy your Flex plugin.

### Setup

Make sure you have [Node.js](https://nodejs.org) as well as [`npm`](https://npmjs.com) installed.

Afterwards, install the dependencies by running `npm install`:

```bash
cd 

# If you use npm
npm install
```

### Development

In order to develop locally, you can use the Twilio CLI to run the plugin locally. Using your commandline run the following from the root dirctory of the plugin.

```bash
twilio flex:plugins:start
```

This will automatically start up the Webpack Dev Server and open the browser for you. Your app will run on `http://localhost:3000`.

When you make changes to your code, the browser window will be automatically refreshed.


### Deploy

#### Plugin Deployment

Once you are happy with your plugin, you have to deploy then release the plugin for it to take affect on Twilio hosted Flex.

Run the following command to start the deployment:

```bash
twilio flex:plugins:deploy --major --changelog "Notes for this version" --description "Functionality of the plugin"
```

After your deployment runs you will receive instructions for releasing your plugin from the bash prompt. You can use this or skip this step and release your plugin from the Flex plugin dashboard here https://flex.twilio.com/admin/plugins

For more details on deploying your plugin, refer to the [deploying your plugin guide](https://www.twilio.com/docs/flex/plugins#deploying-your-plugin).

Note: Common packages like `React`, `ReactDOM`, `Redux` and `ReactRedux` are not bundled with the build because they are treated as external dependencies so the plugin will depend on Flex to provide them globally.

## Flex UI Configuration

Before running the plugin, [update your Flex configuration](https://www.twilio.com/docs/flex/developer/ui/configuration) `ui_attributes` object to include the following additional string properties:
- `domainName`: the domain of the serverless functions deployed as part of these instructions
- `directoryUrl`: the URL of the custom transfer directory JSON

## Twilio Serverless 

You will need the [Twilio CLI](https://www.twilio.com/docs/twilio-cli/quickstart) and the [serverless plugin](https://www.twilio.com/docs/labs/serverless-toolkit/getting-started) to deploy the functions inside the ```serverless``` folder of this project. You can install the necessary dependencies with the following commands:

`npm install twilio-cli -g`

and then

`twilio plugins:install @twilio-labs/plugin-serverless`

# How to use

1. Setup all dependencies above: Flex UI configuration and Twilio CLI packages.

2. Clone this repository

3. run `npm install`

4. copy `./serverless/.env.example` to `./serverless/.env` and populate the appropriate environment variables.

```
ACCOUNT_SID=
AUTH_TOKEN=
TWILIO_WORKSPACE_SID=
TWILIO_SERVICE_RETRY_LIMIT=
TWILIO_SERVICE_MIN_BACKOFF=
TWILIO_SERVICE_MAX_BACKOFF=
```

5. cd into ./serverless/ then run 

`npm install` 

and then 

`twilio serverless:deploy` 

(optionally you can run locally with `twilio serverless:start --ngrok=""`)

## Disclaimer
This software is to be considered "sample code", a Type B Deliverable, and is delivered "as-is" to the user. Twilio bears no responsibility to support the use or implementation of this software.
