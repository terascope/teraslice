import React from 'react';
import gql from 'graphql-tag';
import { ApolloConsumer } from 'react-apollo';
import ListQuery, { LIST_QUERY } from './Query';
import {
    DataTable,
    RowMapping,
    formatDate,
    useCoreContext,
} from '../../../core';

const List: React.FC = () => {
    const authUser = useCoreContext().authUser!;

    const rowMapping: RowMapping = {
        getId(record) {
            return record.id;
        },
        canRemove() {
            if (authUser.type === 'USER') return false;
            return true;
        },
        columns: {
            name: { label: 'Role Name' },
            description: {
                label: 'Description',
                format(record) {
                    return record.description || '--';
                },
            },
            created: {
                label: 'Created',
                format(record) {
                    return formatDate(record.created);
                },
            },
        },
    };

    return (
        <ListQuery>
            {({ updateQueryState, queryState, total, records, loading }) => {
                return (
                    <ApolloConsumer>
                        {client => (
                            <DataTable
                                rowMapping={rowMapping}
                                baseEditPath="/roles/edit"
                                removeRecords={async docs => {
                                    if (docs === true) {
                                        throw new Error(
                                            'Removing all roles in not supported yet'
                                        );
                                    }

                                    const promises = docs.map(record => {
                                        return client.mutate({
                                            mutation: REMOVE_QUERY,
                                            variables: {
                                                id: record.id,
                                            },
                                            refetchQueries: [
                                                {
                                                    query: LIST_QUERY,
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

export default List;

const REMOVE_QUERY = gql`
    mutation RemoveRole($id: ID!) {
        removeRole(id: $id)
    }
`;
