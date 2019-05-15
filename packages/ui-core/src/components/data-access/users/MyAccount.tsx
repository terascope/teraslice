import React from 'react';
import { PluginPage, tsWithRouter, useCoreContext } from '../../core';
import UserForm from './Form';

export default tsWithRouter(() => {
    const authUser = useCoreContext().authUser!;

    return (
        <PluginPage>
            <UserForm id={authUser.id} />
        </PluginPage>
    );
});
