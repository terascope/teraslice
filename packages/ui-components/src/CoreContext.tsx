import React, { createContext, useContext, useState } from 'react';
import * as i from './interfaces';

export const CoreContext = createContext<i.CoreContextState>({
    authenticated: false,
    updateState(updates) {},
});


const CoreContextProvider: React.FC<Props> = ({ children }) => {
    const [state, setState] = useState<i.CoreContextState>({
        authenticated: false,
        updateState,
    });

    function updateState(updates: Partial<i.CoreContextState>) {
        setState({ ...state, ...updates });
    }

    return <CoreContext.Provider value={state}>{children}</CoreContext.Provider>;
};

type Props = {};
CoreContextProvider.propTypes = {};

export { CoreContextProvider };

export const useCoreContext = () => useContext(CoreContext);
