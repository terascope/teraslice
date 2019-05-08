import React from 'react';
import { Page } from '../../core';
import Query from './Query';
import Form from './Form';

const CreateUser: React.FC = () => {
    return (
        <Page title="Create Users">
            <Query component={Form} />
        </Page>
    );
};

export default CreateUser;
