import React from 'react';
import { ApolloConsumer } from 'react-apollo';
import { ModelName } from '@terascope/data-access';
import ListQuery from './Query';
import { DataTable, RowMapping } from '@terascope/ui-components';
import { getModelConfig } from '../config';
import { ModelNameProp } from '../interfaces';

const ModelList: React.FC<Props> = ({ modelName }) => {
    const config = getModelConfig(modelName);

    return (
        <ListQuery modelName={modelName}>
            {({ updateQueryState, queryState, total, records, loading }) => {
                return (
                    <ApolloConsumer>
                        {client => (
                            <DataTable
                                rowMapping={config.rowMapping as RowMapping}
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
    modelName: ModelName;
};

ModelList.propTypes = {
    modelName: ModelNameProp.isRequired,
};

export default ModelList;
