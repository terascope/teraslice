import React, { createContext, useContext } from 'react';
import { PluginConfig, PluginsProp } from './interfaces';

export type CoreContextState = {
    authenticated: boolean;
    plugins: PluginConfig[];
    updateAuth(authenticated: boolean): void;
};

export const CoreContext = createContext<CoreContextState>({
    authenticated: false,
    plugins: [],
    updateAuth(authenticated: boolean) {}
});

type Props = {
    plugins: PluginConfig[];
};

type State = {
    authenticated: boolean;
};

export class CoreContextProvider extends React.Component<Props, State> {
    static propTypes = {
        plugins: PluginsProp,
    };

    state = {
        authenticated: false,
    };

    updateAuth = (authenticated: boolean) => {
        this.setState({
            authenticated,
        });
    }

    render() {
        const { children, plugins } = this.props;

        const value: CoreContextState = {
            authenticated: this.state.authenticated,
            updateAuth: this.updateAuth,
            plugins,
        };

        return (
            <CoreContext.Provider value={value}>
                {children}
            </CoreContext.Provider>
        );
    }
}

export const useCoreContext = () => useContext(CoreContext);
