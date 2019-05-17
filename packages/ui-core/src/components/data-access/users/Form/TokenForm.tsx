import React, { useState } from 'react';
import gql from 'graphql-tag';
import PropTypes from 'prop-types';
import { Mutation } from 'react-apollo';
import { Form, Button } from 'semantic-ui-react';
import { AUTH_QUERY, ErrorMessage } from '../../../core';
import { WITHOUT_ID_QUERY } from './Query';
import { get } from '@terascope/utils';

const TokenForm: React.FC<Props> = ({ token, id }) => {
    const [_showToken, setShowToken] = useState(false);

    const refetchQueries = [
        { query: AUTH_QUERY },
        {
            query: WITHOUT_ID_QUERY,
            variables: { id },
        },
    ];

    return (
        <UpdateToken
            mutation={UPDATE_TOKEN}
            variables={{ id }}
            refetchQueries={refetchQueries}
        >
            {(submit, { loading, data, error }) => {
                const newToken = get(data, 'updateToken');
                const tokenValue = newToken || token;
                const showToken = _showToken || loading || newToken;
                return (
                    <Form.Group>
                        <Form.Input
                            type={showToken || loading ? 'text' : 'password'}
                            label="API Token"
                            width={8}
                            loading={loading}
                            value={tokenValue}
                        >
                            <input readOnly />
                            <Button
                                icon="eye"
                                basic
                                onClick={(e: any) => {
                                    e.preventDefault();
                                    setShowToken(!showToken);
                                }}
                            />
                            <Button
                                icon="redo"
                                label="New Token"
                                labelPosition="left"
                                loading={loading}
                                onClick={async (e: any) => {
                                    e.preventDefault();
                                    submit();
                                }}
                            />
                        </Form.Input>
                        {error && <ErrorMessage error={error} />}
                    </Form.Group>
                );
            }}
        </UpdateToken>
    );
};

type Response = {
    updateToken: string;
};

type Vars = {
    id: string;
};

class UpdateToken extends Mutation<Response, Vars> {}

const UPDATE_TOKEN = gql`
    mutation UpdateToken($id: ID!) {
        updateToken(id: $id)
    }
`;

type Props = {
    token: string;
    id: string;
};

TokenForm.propTypes = {
    token: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
};

export default TokenForm;
