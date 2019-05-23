import React from 'react';
import PropTypes from 'prop-types';
import { AnyObject } from '@terascope/utils';
import { Mutation, MutationFn, MutationResult } from 'react-apollo';
import { PureQueryOptions } from 'apollo-boost';
import { getModelConfig } from '../config';
import { ModelName } from '@terascope/data-access';
import { ModelNameProp } from '../interfaces';
import { SubmitVars } from './interfaces';

type RealResponse = AnyObject;

type Response = {
    id: string;
};

class AnyMutationQuery extends Mutation<RealResponse, SubmitVars> {}

type Children = (
    submit: MutationFn<Response, SubmitVars>,
    result: MutationResult<Response>
) => React.ReactNode;

const MutationQuery: React.FC<Props> = ({ id, children, modelName }) => {
    const config = getModelConfig(modelName);
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
    modelName: ModelName;
    children: Children;
};

MutationQuery.propTypes = {
    id: PropTypes.string,
    modelName: ModelNameProp.isRequired,
    children: PropTypes.func.isRequired,
};

export default MutationQuery;
