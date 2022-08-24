import { FlexPlugin } from '@twilio/flex-plugin';
import * as Flex from "@twilio/flex-ui";
import reducers, { namespace } from './states';
import { Action } from './states/DirectoryState';
import CustomDirectoryContainer from "./components/CustomDirectory/CustomDirectory.Container";
import registerCustomActions from './customActions';
import registerCustomEvents from './events';
import registerCustomNotifications from './notifications';
import { loadExternalTransferInterface } from './components/ExternalTransfer';
import { loadInternalCallInterface } from './components/InternalCall';
import { CustomizationProvider } from "@twilio-paste/core/customization";
import { StylesProvider, createGenerateClassName, MuiThemeProvider, createTheme } from '@material-ui/core/styles';
import { resetHangUpBy } from './helpers/hangUpBy';
import { withTheme } from '@twilio/flex-ui';

const PLUGIN_NAME = 'DialpadPlugin';

export default class DialpadPlugin extends FlexPlugin {
  constructor() {
    super(PLUGIN_NAME);
  }

  init(flex, manager) {
    
    const FlexThemeProvider = withTheme(({ theme, children }) => {
      return (
            <MuiThemeProvider theme={createTheme(theme)}>
                <StylesProvider generateClassName={createGenerateClassName({
                    productionPrefix: PLUGIN_NAME,
                  })}>
                    {children}
                </StylesProvider>
            </MuiThemeProvider>
      )
    });
    
    Flex.setProviders({
        CustomProvider: (RootComponent) => (props) => {
            return (
                <FlexThemeProvider>
                    <RootComponent {...props} />
                </FlexThemeProvider>
            );
        },
        PasteThemeProvider: CustomizationProvider,
    });

    loadExternalTransferInterface.bind(this)(flex, manager)
    loadInternalCallInterface.bind(this)(flex, manager)
    this.registerReducers(manager);
    this.dispatch(Action.getDirectory());

    flex.WorkerDirectory.Tabs.Content.add(
      <flex.Tab
        key="customer-directory-container"
        label="Directory">
        <CustomDirectoryContainer key="customer-directory-container" />
      </flex.Tab>
    );

    resetHangUpBy(manager);
    
    registerCustomActions(manager);
    registerCustomEvents(manager);
    registerCustomNotifications(flex, manager);
  }

  dispatch = (f) => Flex.Manager.getInstance().store.dispatch(f);

  registerReducers(manager) {
    if (!manager.store.addReducer) {
      // eslint-disable-next-line
      console.error(`You need FlexUI > 1.9.0 to use built-in redux; you are currently on ${VERSION}`);
      return;
    }

    manager.store.addReducer(namespace, reducers);
  }
}
