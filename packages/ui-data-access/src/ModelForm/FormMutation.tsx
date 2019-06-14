import React from 'react';
import PropTypes from 'prop-types';
import { PureQueryOptions } from 'apollo-boost';
import { Mutation, MutationFn, MutationResult } from 'react-apollo';
import { ModelName } from '@terascope/data-access';
import { getModelConfig } from '../config';
import { ModelNameProp } from '../interfaces';
import { SubmitVars } from './interfaces';

type Response = {
    id: string;
};

type Children<T> = (
    submit: MutationFn<Response, SubmitVars<T>>,
    result: MutationResult<Response>
) => React.ReactNode;

function MutationQuery<T>({
    id,
    children,
    modelName,
}: Props<T>): React.ReactElement | null {
    const config = getModelConfig(modelName);
    const update = Boolean(id);
    const refetchQueries: PureQueryOptions[] = [{ query: config.listQuery }];

    if (update) {
        refetchQueries.push({ query: config.updateQuery, variables: { id } });
    }

    return (
        <Mutation<{ result: Response }, SubmitVars<T>>
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
        </Mutation>
    );
}

type Props<T> = {
    id?: string;
    modelName: ModelName;
    children: Children<T>;
};

MutationQuery.propTypes = {
    id: PropTypes.string,
    modelName: ModelNameProp.isRequired,
    children: PropTypes.func.isRequired,
};

export default MutationQuery;
