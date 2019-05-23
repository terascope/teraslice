import React from 'react';
import { ApolloConsumer } from 'react-apollo';
import { ModelName } from '@terascope/data-access';
import ListQuery from './Query';
import { DataTable } from '@terascope/ui-components';
import { getModelConfig } from '../utils';
import { ModelNameProp } from '../interfaces';

const ModelList: React.FC<Props> = ({ model }) => {
    const config = getModelConfig(model);

    return (
        <ListQuery model={model}>
            {({ updateQueryState, queryState, total, records, loading }) => {
                return (
                    <ApolloConsumer>
                        {client => (
                            <DataTable
                                rowMapping={config.rowMapping}
                                baseEditPath={`/${config.pathname}/edit`}
                                removeRecords={async docs => {
                                    if (docs === true) {
                                        throw new Error(
                                            `Removing all ${
                                                config.pluralLabel
                                            } in not supported yet`
                                        );
                                    }

                                    const promises = docs.map(record => {
                                        return client.mutate({
                                            mutation: config.removeMutation,
                                            variables: {
                                                id: record.id,
                                            },
                                            refetchQueries: [
                                                {
                                                    query: config.listQuery,
                                                    variables: queryState,
                                                },
                                            ],
                                        });
                                    });

                                    await Promise.all(promises);

                                    return `Successful deleted ${
                                        docs.length
                                    } records`;
                                }}
                                loading={loading}
                                records={records}
                                total={total}
                                queryState={queryState}
                                updateQueryState={updateQueryState}
                            />
                        )}
                    </ApolloConsumer>
                );
            }}
        </ListQuery>
    );
};

type Props = {
    model: ModelName;
};

ModelList.propTypes = {
    model: ModelNameProp.isRequired,
};

export default ModelList;
