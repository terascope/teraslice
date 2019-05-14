import React from 'react';
import { Page, tsWithRouter, useCoreContext } from '../../core';
import UserForm from './Form';

export default tsWithRouter(() => {
    const authUser = useCoreContext().authUser!;

    return (
        <Page title="My Account">
            <UserForm id={authUser.id} />
        </Page>
    );
});
