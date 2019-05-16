import React from 'react';
import gql from 'graphql-tag';
import { ApolloConsumer } from 'react-apollo';
import ListQuery from './Query';
import {
    DataTable,
    RowMapping,
    useCoreContext,
    formatDate,
} from '../../../core';

const List: React.FC = () => {
    const authUser = useCoreContext().authUser!;

    const rowMapping: RowMapping = {
        getId(record) {
            return record.username;
        },
        canRemove(record) {
            if (record.type === 'SUPERADMIN') return false;
            if (record.id === authUser.id) return false;
            return true;
        },
        columns: {
            username: { label: 'Username' },
            firstname: { label: 'First Name' },
            lastname: { label: 'Last Name' },
            role: { label: 'Role' },
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
                                baseEditPath="/users/edit"
                                removeRecords={async docs => {
                                    if (docs === true) {
                                        throw new Error(
                                            'Removing all users in not supported yet'
                                        );
                                    }

                                    const promises = docs.map(record => {
                                        return client.mutate({
                                            mutation: REMOVE_QUERY,
                                            variables: {
                                                id: record.id,
                                            },
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
    mutation RemoveUser($id: ID!) {
        removeUser(id: $id)
    }
`;
