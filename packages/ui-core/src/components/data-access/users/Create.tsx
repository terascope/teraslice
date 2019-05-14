import React from 'react';
import { Page } from '../../core';
import UserForm from './Form';

const Create: React.FC = () => {
    return (
        <Page title="Create Users">
            <UserForm />
        </Page>
    );
};

export default Create;
