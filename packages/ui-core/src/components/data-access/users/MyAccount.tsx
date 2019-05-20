import React from 'react';
import { tsWithRouter, useCoreContext } from '@terascope/ui-components';
import UserForm from './Form';

export default tsWithRouter(() => {
    const authUser = useCoreContext().authUser!;

    return <UserForm id={authUser.id} />;
});
