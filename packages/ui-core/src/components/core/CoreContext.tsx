import React, { createContext, useContext } from 'react';

export type CoreContextState = {
    authenticated: boolean;
    updateAuth(authenticated: boolean): void;
};

export const CoreContext = createContext<CoreContextState>({
    authenticated: false,
    updateAuth(authenticated: boolean) {}
});

type Props = {};
type State = {
    authenticated: boolean;
};

export class CoreContextProvider extends React.Component<Props, State> {
    state = {
        authenticated: false,
    };

    updateAuth = (authenticated: boolean) => {
        this.setState({
            authenticated,
        });
    }

    render() {
        const { children } = this.props;

        const value: CoreContextState = {
            authenticated: this.state.authenticated,
            updateAuth: this.updateAuth,
        };

        return (
            <CoreContext.Provider value={value}>
                {children}
            </CoreContext.Provider>
        );
    }
}

export const useCoreContext = () => useContext(CoreContext);
