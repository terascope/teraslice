import React from 'react';
import gql from 'graphql-tag';
import PropTypes from 'prop-types';
import { AnyObject } from '@terascope/utils';
import { PureQueryOptions } from 'apollo-boost';
import { ModelName } from '@terascope/data-access';
import { Mutation, MutationFn, MutationResult } from 'react-apollo';
import { WITH_ID_QUERY } from './Query';
import { ModelNameProp } from '../../interfaces';
import { getModelConfig } from '../../utils';

const CREATE_QUERY = gql`
    mutation Role($input: CreateRoleInput!) {
        result: createRole(role: $input) {
            id
        }
    }
`;

const UPDATE_QUERY = gql`
    mutation Role($input: UpdateRoleInput!) {
        result: updateRole(role: $input) {
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

const MutationQuery: React.FC<Props> = ({ id, children, model }) => {
    const { listQuery } = getModelConfig(model);
    const update = Boolean(id);
    const refetchQueries: PureQueryOptions[] = [{ query: listQuery }];

    if (id) {
        refetchQueries.push({ query: WITH_ID_QUERY, variables: { id } });
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
