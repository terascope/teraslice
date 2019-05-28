import gql from 'graphql-tag';
import { get } from '@terascope/utils';
import { formatDate } from '@terascope/ui-components';
import { inputFields, Input, Role } from './Form/interfaces';
import { ModelConfig } from '../interfaces';

const config: ModelConfig = {
    name: 'User',
    pathname: 'users',
    singularLabel: 'User',
    pluralLabel: 'Users',
    searchFields: ['firstname', 'lastname', 'username', 'email'],
    requiredFields: ['username', 'firstname', 'lastname', 'type'],
    rowMapping: {
        getId(record) {
            return record.username;
        },
        canRemove(record, authUser) {
            if (record.type === 'SUPERADMIN') return false;
            if (record.id === (authUser && authUser.id)) return false;
            if (authUser && authUser.type !== 'USER') return false;
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
    handleFormProps(authUser, data) {
        const user = get(data, 'user');
        const input = {} as Input;
        for (const field of inputFields) {
            if (field === 'role') {
                input.role = get(user, 'role.id') || '';
            } else {
                input[field] = get(user, field) || '';
            }
        }
        if (!input.client_id && authUser.client_id) {
            input.client_id = authUser.client_id;
        }
        if (!input.type) input.type = 'USER';
        if (input.type === 'SUPERADMIN') {
            input.client_id = 0;
        }

        const roles: Role[] = get(data, 'roles', []);
        return { input, roles };
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
    updateQuery: gql`
        query UpdateQuery($id: ID!) {
            roles(query: "*") {
                id
                name
            }
            user(id: $id) {
                id
                client_id
                firstname
                lastname
                username
                email
                api_token
                role {
                    id
                    name
                }
                type
            }
        }
    `,
    createQuery: gql`
        {
            roles(query: "*") {
                id
                name
            }
        }
    `,
    createMutation: gql`
        mutation CreateUser($input: CreateUserInput!, $password: String!) {
            result: createUser(user: $input, password: $password) {
                id
            }
        }
    `,
    updateMutation: gql`
        mutation UpdateUser($input: UpdateUserInput!, $password: String) {
            result: updateUser(user: $input, password: $password) {
                id
            }
        }
    `,
    removeMutation: gql`
        mutation RemoveUser($id: ID!) {
            result: removeUser(id: $id)
        }
    `,
};

export default config;
