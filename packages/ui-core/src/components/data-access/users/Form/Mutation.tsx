import React from 'react';
import gql from 'graphql-tag';
import PropTypes from 'prop-types';
import { AnyObject } from '@terascope/utils';
import { Mutation, MutationFn, MutationResult } from 'react-apollo';
import { LIST_QUERY } from '../List/Query';
import { PureQueryOptions } from 'apollo-boost';
import { WITH_ID_QUERY, WITHOUT_ID_QUERY } from './Query';

const CREATE_QUERY = gql`
    mutation User($input: CreateUserInput!, $password: String!) {
        createUser(user: $input, password: $password) {
            id
            username
            type
        }
    }
`;

const UPDATE_QUERY = gql`
    mutation User($input: UpdateUserInput!, $password: String) {
        updateUser(user: $input, password: $password) {
            id
            username
            type
        }
    }
`;

type RealResponse = AnyObject;

type Response = {
    id: string;
};

type Vars = {
    input: AnyObject;
    password?: string;
};

class AnyMutationQuery extends Mutation<RealResponse, Vars> {}

type Children = (
    submit: MutationFn<Response, Vars>,
    result: MutationResult<Response>
) => React.ReactNode;

const MutationQuery: React.FC<Props> = ({ id, children }) => {
    const update = Boolean(id);
    const refetchQueries: PureQueryOptions[] = [{ query: LIST_QUERY }];

    if (id) {
        refetchQueries.push({ query: WITH_ID_QUERY, variables: { id } });
    } else {
        refetchQueries.push({ query: WITHOUT_ID_QUERY, variables: { id } });
    }

    return (
        <AnyMutationQuery
            mutation={update ? UPDATE_QUERY : CREATE_QUERY}
            refetchQueries={LIST_QUERY}
        >
            {(action, result) => {
                let data: any;
                if (result && result.data) {
                    for (const [key, val] of Object.entries(result.data)) {
                        if (key.startsWith('create') && val.id) {
                            data = val;
                        } else if (key.startsWith('update') && val.id) {
                            data = val.id;
                        }
                    }
                }

                const queryResult: any = result;
                if (data) {
                    queryResult.data = data;
                }

                return children((input: any) => action(input), queryResult);
            }}
        </AnyMutationQuery>
    );
};

type Props = { id?: string; children: Children };

MutationQuery.propTypes = {
    id: PropTypes.string,
    children: PropTypes.func.isRequired,
};

export default MutationQuery;
