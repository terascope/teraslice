import React from 'react';
import gql from 'graphql-tag';
import PropTypes from 'prop-types';
import { AnyObject } from '@terascope/utils';
import { Mutation, MutationFn, MutationResult } from 'react-apollo';
import { LIST_QUERY } from '../List/Query';
import { WITH_ID_QUERY } from './Query';
import { PureQueryOptions } from 'apollo-boost';

const CREATE_QUERY = gql`
    mutation Role($input: CreateRoleInput!) {
        createRole(role: $input) {
            id
        }
    }
`;

const UPDATE_QUERY = gql`
    mutation Role($input: UpdateRoleInput!) {
        updateRole(role: $input) {
            id
        }
    }
`;

type RealResponse = AnyObject;

type Response = {
    id: string;
};

type Vars = {
    input: AnyObject;
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
    }

    return (
        <AnyMutationQuery
            mutation={update ? UPDATE_QUERY : CREATE_QUERY}
            refetchQueries={refetchQueries}
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
