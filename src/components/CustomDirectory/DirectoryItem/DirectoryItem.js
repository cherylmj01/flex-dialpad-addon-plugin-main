import * as React from "react";
import {
  Actions,
  IconButton,
  UserCard,
  templates,
  withTheme,
  withTaskContext,
  Manager
} from '@twilio/flex-ui';
import { ButtonContainer, CallButton, ItemInnerContainer } from '../CustomDirectoryComponents';
import { WorkerMarginPlaceholder } from './DirectoryItemComponents';
import conferenceService from "../../../helpers/ConferenceService";

class DirectoryItem extends React.Component {

    constructor(props){        
        super(props);
    }

    onWarmTransferClick = (e) => {
        this.props.onTransferClick({ mode: "WARM" });
        this.addConferenceParticipant();
        Actions.invokeAction("HideDirectory");
    };

    onColdTransferClick = async (e) => {
        this.props.onTransferClick({ mode: "COLD" });
        this.doColdTransfer();
        Actions.invokeAction("HideDirectory");
    };

    addConferenceParticipant = async () => {
        
        const to = this.props.item.phone;
        const { task } = this.props;
        const conference = task && (task.conference || {});
        const { conferenceSid } = conference;

        const mainConferenceSid = task.attributes.conference ? 
        task.attributes.conference.sid : conferenceSid;

        let from;
        
        if (this.props.phoneNumber) {
            from = this.props.phoneNumber
          }
        else {
            from = Manager.getInstance().serviceConfiguration.outbound_call_flows.default.caller_id;
        }

        console.log(`Adding ${to} to conference`);

        let participantCallSid;

        try {
            participantCallSid = await conferenceService.addParticipant(mainConferenceSid, from, to);
            conferenceService.addConnectingParticipant(mainConferenceSid, participantCallSid, 'unknown');
        }
        catch(error){
            console.error('Error adding conference participant:', error);
        }

    }

    doColdTransfer = async () => {
        const to = this.props.item.phone;
        const { task } = this.props;
        const callSid = task.attributes.call_sid;
        try {
            await conferenceService.coldTransfer(callSid, to);
        }
        catch(error){
            console.error('Error while doing Cold Transfer:', error);
        }

    }


    render(){
       
        const {enableWarmTransfer, phone, name} = this.props.item;
        
        return(
            <ItemInnerContainer className="Twilio-WorkerDirectory-Worker" noGrow noShrink>
            <WorkerMarginPlaceholder noGrow noShrink />
            <UserCard
            className="Twilio-WorkerDirectory-UserCard"
            firstLine={name}
            secondLine={phone}
            isAvailable
            imageUrl=""
            large
            />
            <ButtonContainer className="Twilio-WorkerDirectory-ButtonContainer"> 
            {enableWarmTransfer === 'true' && 
            <CallButton
            icon="Call"
            onClick={this.onWarmTransferClick}
            variant='secondary'
            size='small'
            title={templates.WarmTransferTooltip()}
            />
            }
            
            <IconButton
                icon="Transfer"
                onClick={this.onColdTransferClick}
                variant='secondary'
                size='small'
                title={templates.ColdTransferTooltip()}
            />
            </ButtonContainer>
            </ItemInnerContainer>
        )
    }


}


export default (withTheme(withTaskContext(DirectoryItem)));