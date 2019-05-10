import React from 'react';
import { withRouter } from 'react-router-dom';
import { Page } from '../../core';
import UserForm from '../UserForm';

export default withRouter(({ match }) => {
    return (
        <Page title="Edit Users">
            <UserForm id={match.params.id} />
        </Page>
    );
});
