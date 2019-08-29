import React from 'react';
import { toNumber } from '@terascope/utils';
import { stringify, parse } from 'query-string';
import { useQuery } from 'react-apollo';
import { ModelName } from '@terascope/data-access';
import {
    ErrorPage,
    QueryState,
    formatRegexQuery,
    tsWithRouter,
    UpdateQueryState,
} from '@terascope/ui-components';
import { ModelNameProp } from '../interfaces';
import { getModelConfig } from '../config';

const ListQuery = tsWithRouter<Props>(
    ({
        history, location, children: Component, modelName
    }) => {
        const { searchFields, listQuery } = getModelConfig(modelName);

        const state: QueryState = Object.assign(
            {
                query: '',
                size: 10,
            },
            parse(location.search)
        );

        if (state.size) state.size = toNumber(state.size);
        if (state.from) state.from = toNumber(state.from);

        const updateQueryState = (updates: QueryState) => {
            history.push({
                search: stringify({ ...state, ...updates }),
            });
        };

        const variables = {
            ...state,
            query: formatRegexQuery(state.query || '', searchFields),
        };

        const { loading, error, data } = useQuery<Response>(listQuery, {
            variables,
            fetchPolicy: 'cache-and-network',
        });

        if (error) return <ErrorPage error={error} />;
        if (!data && !loading) {
            return <ErrorPage error="Unexpected Error" />;
        }

        const records = (data && data.records) || [];
        const total = (data && data.total) || 0;

        return (
            <Component
                queryState={state}
                total={total}
                loading={loading}
                records={records}
                updateQueryState={updateQueryState}
            />
        );
    }
);

type ComponentProps = {
    queryState: QueryState;
    total: number;
    loading: boolean;
    records: any[];
    updateQueryState: UpdateQueryState;
};

type Props = {
    modelName: ModelName;
    children: React.FC<ComponentProps>;
};

ListQuery.propTypes = {
    modelName: ModelNameProp.isRequired,
};

export default ListQuery;

interface Response {
    records: any[];
    total: number;
}
