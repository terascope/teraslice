import React from 'react';
import PropTypes from 'prop-types';
import { AnyObject } from '@terascope/utils';
import { Mutation, MutationFn, MutationResult } from 'react-apollo';
import { PureQueryOptions } from 'apollo-boost';
import { getModelConfig } from '../config';
import { ModelName } from '@terascope/data-access';
import { ModelNameProp } from '../interfaces';

type RealResponse = AnyObject;

type Response = {
    id: string;
};

type Vars = {
    [extra: string]: any;
    input: AnyObject;
};

class AnyMutationQuery extends Mutation<RealResponse, Vars> {}

type Children = (
    submit: MutationFn<Response, Vars>,
    result: MutationResult<Response>
) => React.ReactNode;

const MutationQuery: React.FC<Props> = ({ id, children, model }) => {
    const config = getModelConfig(model);
    const update = Boolean(id);
    const refetchQueries: PureQueryOptions[] = [{ query: config.listQuery }];

    if (update) {
        refetchQueries.push({ query: config.updateQuery, variables: { id } });
    }

    return (
        <AnyMutationQuery
            mutation={update ? config.updateMutation : config.createMutation}
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
