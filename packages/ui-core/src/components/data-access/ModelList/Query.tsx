import React from 'react';
import { toNumber } from '@terascope/utils';
import { stringify, parse } from 'query-string';
import { Query as ApolloQuery } from 'react-apollo';
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
    ({ history, location, children: Component, modelName }) => {
        const { searchFields, listQuery } = getModelConfig(modelName);

        const state: QueryState = Object.assign(
            {
                query: '*',
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

        const variables =
            state.query && state.query !== '*'
                ? {
                    ...state,
                    query: formatRegexQuery(state.query || '', searchFields),
                }
                : state;

        return (
            <Query
                query={listQuery}
                variables={variables}
                fetchPolicy="cache-and-network"
            >
                {({ loading, error, data }) => {
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
                }}
            </Query>
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

class Query extends ApolloQuery<Response, QueryState> {}
