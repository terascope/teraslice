import React, { useState } from 'react';
import gql from 'graphql-tag';
import PropTypes from 'prop-types';
import { ApolloConsumer } from 'react-apollo';
import { Form, Button } from 'semantic-ui-react';
import { get } from '@terascope/utils';
import { AUTH_QUERY } from '../../../core';

const TokenForm: React.FC<Props> = ({ token: _token, id }) => {
    const [showToken, setShowToken] = useState(false);
    const [token, setToken] = useState(_token);

    return (
        <ApolloConsumer>
            {client => {
                return (
                    <Form.Input
                        type={showToken ? 'text' : 'password'}
                        label="API Token"
                        width={8}
                        value={token}
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
                            onClick={async (e: any) => {
                                e.preventDefault();
                                const result = await client.mutate({
                                    mutation: UPDATE_TOKEN,
                                    variables: {
                                        id,
                                    },
                                    refetchQueries: [{ query: AUTH_QUERY }],
                                });

                                const newToken = get(
                                    result,
                                    'data.updateToken'
                                );

                                if (newToken) {
                                    setToken(newToken);
                                }
                            }}
                        />
                    </Form.Input>
                );
            }}
        </ApolloConsumer>
    );
};

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
