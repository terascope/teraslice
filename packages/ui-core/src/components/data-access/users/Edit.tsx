import React from 'react';
import { Page, tsWithRouter } from '../../core';
import UserForm from './Form';

export default tsWithRouter(({ match }) => {
    return (
        <Page title="Edit Users">
            <UserForm id={match.params.id} />
        </Page>
    );
});
