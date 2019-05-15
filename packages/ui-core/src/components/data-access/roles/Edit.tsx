import React from 'react';
import { Page, tsWithRouter } from '../../core';
import Form from './Form';

export default tsWithRouter(({ match }) => {
    return (
        <Page title="Edit Role">
            <Form id={match.params.id} />
        </Page>
    );
});
