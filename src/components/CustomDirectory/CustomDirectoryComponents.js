import {
    FlexBox,
    getBackgroundWithHoverCSS,
    IconButton,
    FlexBoxColumn,
    styled
  } from '@twilio/flex-ui'
import Input from '@material-ui/core/Input';
import InputAdornment from "@material-ui/core/InputAdornment";


export const CallButton = styled(IconButton)`
  margin-right: 8px;
`;

export const ItemInnerContainer = styled(FlexBox)`
  display: flex;
  padding-left: 0px;
  padding-right: 12px;
  color: inherit;
  outline: none;
  height: 44px;
  background: none;
  border: none;
  border-style: solid;
  border-width: 0px 0px 1px 0px;
  ${(props) => props.theme.WorkerDirectory.Item}
  &:hover, &:focus-within {
    & .Twilio-WorkerDirectory-ButtonContainer {
      opacity: 1;
      display: flex;
    & * {
      max-width: inherit;
      max-height: inherit;
    }
   }  
  }
`;

export const ButtonContainer = styled("div")`
  display: none;
`;

export const ItemContainer = styled(FlexBox)`
  flex-grow: 1;
  overflow-y: auto;
  border-style: solid;
  border-width: 1px 0 0 0;
  ${(props) => props.theme.WorkerDirectory.ItemsContainer}
`;

export const StyledInput = styled(Input)`
  margin-left: 12px;
  margin-top: 10px;
  width: calc(100% - 24px);
`;

export const StyledInputAdornment = styled(InputAdornment)`
  height: ${(props) => props.theme.tokens.sizings.sizeSquare100};
  background: ${(props) => props.theme.tokens.backgroundColors.colorBackground};
  border-right: ${(props) =>
    `${props.theme.tokens.borderWidths.borderWidth10} solid ${props.theme.tokens.borderColors.colorBorderWeaker}`};
`;

export const InputContainer = styled("div")`
  flex: 0 0 56px;
`;

export const TabContainer = styled(FlexBoxColumn)`
  overflow-x: hidden;
`;
