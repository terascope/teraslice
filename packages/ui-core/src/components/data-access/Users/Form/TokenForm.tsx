import React, { useState } from 'react';
import gql from 'graphql-tag';
import PropTypes from 'prop-types';
import { Mutation } from 'react-apollo';
import { Form, Button } from 'semantic-ui-react';
import {
    AUTH_QUERY,
    ErrorMessage,
    useCoreContext,
} from '@terascope/ui-components';
import { get } from '@terascope/utils';
import { PureQueryOptions } from 'apollo-boost';
import { getModelConfig } from '../../config';

const TokenForm: React.FC<Props> = ({ token, id }) => {
    const authUser = useCoreContext().authUser!;
    const [showToken, setShowToken] = useState(false);

    const refetchQueries: PureQueryOptions[] = [
        {
            query: getModelConfig('User').updateQuery,
            variables: { id },
        },
    ];

    if ([authUser.username, authUser.id].includes(id)) {
        refetchQueries.push({ query: AUTH_QUERY });
    }

    return (
        <UpdateToken
            mutation={UPDATE_TOKEN}
            variables={{ id }}
            onCompleted={() => {
                setShowToken(true);
            }}
            refetchQueries={refetchQueries}
        >
            {(submit, { loading, data, error }) => {
                return (
                    <Form.Group>
                        <Form.Input
                            type={showToken || loading ? 'text' : 'password'}
                            label="API Token"
                            width={8}
                            loading={loading}
                            value={get(data, 'updateToken', token)}
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
                                onClick={(e: any) => {
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
