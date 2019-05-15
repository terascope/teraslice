import React from 'react';
import { PluginPage, tsWithRouter } from '../../core';
import Form from './Form';

export default tsWithRouter(({ match }) => {
    return (
        <PluginPage>
            <Form id={match.params.id} />
        </PluginPage>
    );
});
