import React from 'react';
import { Page } from '../../core';
import Query from '../UserForm/Query';
import Form from '../UserForm/Form';

const EditUser: React.FC = () => {
    return (
        <Page title="Edit Users">
            <Query component={Form} />
        </Page>
    );
};

export default EditUser;
