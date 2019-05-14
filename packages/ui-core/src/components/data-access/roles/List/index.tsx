import React from 'react';
import gql from 'graphql-tag';
import { ApolloConsumer } from 'react-apollo';
import ListQuery from './Query';
import {
    DataTable,
    Page,
    RowMapping,
    PageAction,
    formatDate
} from '../../../core';

const List: React.FC = () => {
    const rowMapping: RowMapping = {
        getId(record) {
            return record.username;
        },
        canRemove(record) {
            if (record.type === 'SUPERADMIN') return false;
            return true;
        },
        columns: {
            name: { label: 'Role Name' },
            created: {
                label: 'Created',
                format(record) {
                    return formatDate(record.created);
                }
            }
        }
    };

    const actions: PageAction[] = [
        {
            label: 'Create role',
            icon: 'plus',
            to: '/roles/create'
        }
    ];

    return (
        <ListQuery>
            {({ updateQueryState, queryState, total, records, loading }) => {
                return (
                    <ApolloConsumer>
                        {client => (
                            <Page title="Roles" actions={actions}>
                                <DataTable
                                    rowMapping={rowMapping}
                                    title="Role"
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
                                                    id: record.id
                                                }
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
                            </Page>
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
