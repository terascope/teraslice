import React, { createContext, useContext, useState } from 'react';
import * as i from './interfaces';

export const CoreContext = createContext<i.CoreContextState>({
    authenticated: false,
    plugins: [],
    updateState(updates) {}
});

type Props = {
    plugins: i.PluginConfig[];
};

const CoreContextProvider: React.FC<Props> = ({ children, plugins = [] }) => {
    const [state, setState] = useState<i.CoreContextState>({
        authenticated: false,
        updateState,
        plugins,
    });

    function updateState(updates: Partial<i.CoreContextState>) {
        setState({ ...state, ...updates });
    }

    return (
        <CoreContext.Provider value={state}>{children}</CoreContext.Provider>
    );
};

CoreContextProvider.propTypes = {
    plugins: i.PluginsProp,
};

export { CoreContextProvider };

export const useCoreContext = () => useContext(CoreContext);
