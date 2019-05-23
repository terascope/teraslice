import gql from 'graphql-tag';
import { ModelName } from '@terascope/data-access';
import { ModelConfigMapping } from './interfaces';
import { formatDate } from '@terascope/ui-components';

const MODEL_CONFIG: ModelConfigMapping = {
    User: {
        pathname: 'users',
        singularLabel: 'User',
        pluralLabel: 'Users',
        searchFields: ['firstname', 'lastname', 'username', 'email'],
        rowMapping: {
            getId(record) {
                return record.username;
            },
            canRemove(record, authUser) {
                if (record.type === 'SUPERADMIN') return false;
                if (record.id === (authUser && authUser.id)) return false;
                return true;
            },
            columns: {
                username: { label: 'Username' },
                firstname: { label: 'First Name' },
                lastname: { label: 'Last Name' },
                'role.name': { label: 'Role', sortable: false },
                created: {
                    label: 'Created',
                    format(record) {
                        return formatDate(record.created);
                    },
                },
            },
        },
        listQuery: gql`
            query Users($query: String, $from: Int, $size: Int, $sort: String) {
                records: users(query: $query, from: $from, size: $size, sort: $sort) {
                    id
                    client_id
                    firstname
                    lastname
                    username
                    email
                    role {
                        id
                        name
                    }
                    type
                    updated
                    created
                }
                total: usersCount(query: $query)
            }
        `,
        removeMutation: gql`
            mutation RemoveUser($id: ID!) {
                result: removeUser(id: $id)
            }
        `,
    },
    Role: {
        pathname: 'roles',
        singularLabel: 'Role',
        pluralLabel: 'Roles',
        searchFields: ['name'],
        rowMapping: {
            getId(record) {
                return record.id;
            },
            canRemove(record, authUser) {
                if (authUser && authUser.type === 'USER') return false;
                return true;
            },
            columns: {
                name: { label: 'Role Name' },
                description: {
                    label: 'Description',
                    sortable: false,
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
        },
        listQuery: gql`
            query Roles($query: String, $from: Int, $size: Int, $sort: String) {
                records: roles(query: $query, from: $from, size: $size, sort: $sort) {
                    id
                    name
                    description
                    updated
                    created
                }
                total: rolesCount(query: $query)
            }
        `,
        removeMutation: gql`
            mutation RemoveRole($id: ID!) {
                result: removeRole(id: $id)
            }
        `,
    },
    DataType: {
        pathname: 'data-types',
        singularLabel: 'Data Type',
        pluralLabel: 'Data Types',
        searchFields: [],
        // @ts-ignore FIXME
        rowMapping: {},
        removeMutation: '',
        listQuery: '',
    },
    View: {
        pathname: 'views',
        singularLabel: 'View',
        pluralLabel: 'Views',
        searchFields: [],
        // @ts-ignore FIXME
        rowMapping: {},
        removeMutation: '',
        listQuery: '',
    },
    Space: {
        pathname: 'spaces',
        singularLabel: 'Space',
        pluralLabel: 'Spaces',
        searchFields: [],
        // @ts-ignore FIXME
        rowMapping: {},
        removeMutation: '',
        listQuery: '',
    },
};

export function getModelConfig(name: ModelName) {
    return MODEL_CONFIG[name];
}
