import React from 'react';
import gql from 'graphql-tag';
import PropTypes from 'prop-types';
import { AnyObject } from '@terascope/utils';
import { Mutation, MutationFn, MutationResult } from 'react-apollo';
import { PureQueryOptions } from 'apollo-boost';
import { WITH_ID_QUERY, WITHOUT_ID_QUERY } from './Query';
import { getModelConfig } from '../../config';
import { ModelName } from '@terascope/data-access';
import { ModelNameProp } from '../../interfaces';

const CREATE_QUERY = gql`
    mutation User($input: CreateUserInput!, $password: String!) {
        result: createUser(user: $input, password: $password) {
            id
        }
    }
`;

const UPDATE_QUERY = gql`
    mutation User($input: UpdateUserInput!, $password: String) {
        result: updateUser(user: $input, password: $password) {
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
    password?: string;
};

class AnyMutationQuery extends Mutation<RealResponse, Vars> {}

type Children = (
    submit: MutationFn<Response, Vars>,
    result: MutationResult<Response>
) => React.ReactNode;

const MutationQuery: React.FC<Props> = ({ id, children, model }) => {
    const { listQuery } = getModelConfig(model);
    const update = Boolean(id);
    const refetchQueries: PureQueryOptions[] = [{ query: listQuery }];

    if (id) {
        refetchQueries.push({ query: WITH_ID_QUERY, variables: { id } });
    } else {
        refetchQueries.push({ query: WITHOUT_ID_QUERY });
    }

    return (
        <AnyMutationQuery
            mutation={update ? UPDATE_QUERY : CREATE_QUERY}
            refetchQueries={refetchQueries}
        >
            {(action, result) => {
                const queryResult: any = result;
                const data = result && result.data && result.data.result;

                if (data) {
                    queryResult.data = data;
                }

                return children((input: any) => action(input), queryResult);
            }}
        </AnyMutationQuery>
    );
};

type Props = {
    id?: string;
    model: ModelName;
    children: Children;
};

MutationQuery.propTypes = {
    id: PropTypes.string,
    model: ModelNameProp.isRequired,
    children: PropTypes.func.isRequired,
};

export default MutationQuery;
