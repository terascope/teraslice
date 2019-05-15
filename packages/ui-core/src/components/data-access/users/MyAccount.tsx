import React from 'react';
import { tsWithRouter, useCoreContext } from '../../core';
import UserForm from './Form';

export default tsWithRouter(() => {
    const authUser = useCoreContext().authUser!;

    return <UserForm id={authUser.id} />;
});
