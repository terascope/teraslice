import React, { createContext, useContext, useState } from 'react';
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

const CoreContextProvider: React.FC<Props> = ({ children, plugins }) => {
    const [authenticated, updateAuth] = useState(false);

    const value: CoreContextState = {
        authenticated,
        updateAuth,
        plugins,
    };

    return (
        <CoreContext.Provider value={value}>{children}</CoreContext.Provider>
    );
};

CoreContextProvider.propTypes = {
    plugins: PluginsProp,
};

export { CoreContextProvider };

export const useCoreContext = () => useContext(CoreContext);
