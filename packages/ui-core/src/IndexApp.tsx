import React from 'react';
import { CoreContextProvider } from '@terascope/ui-components';
import CoreRouter from './IndexRouter';

const IndexApp = () => {
    return (
        <CoreContextProvider>
            <CoreRouter />
        </CoreContextProvider>
    );
};

export default IndexApp;
