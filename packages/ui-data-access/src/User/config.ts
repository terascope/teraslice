import gql from 'graphql-tag';
import { get } from '@terascope/utils';
import { formatDate } from '@terascope/ui-components';
import { inputFields, Input } from './interfaces';
import { ModelConfig } from '../interfaces';
import { copyField, getModelType } from '../utils';
import { formatStrong } from '../ModelList/Strong';

const fieldsFragment = gql`
    fragment UserFields on User {
        id
        client_id
        firstname
        lastname
        username
        email
        role {
            id
            client_id
            name
        }
        api_token
        type
        updated
        created
    }
`;

const config: ModelConfig<Input> = {
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
        columns: {
            username: { label: 'Username' },
            firstname: { label: 'First Name' },
            lastname: { label: 'Last Name' },
            role: {
                label: 'Role',
                sortable: false,
                format(record) {
                    return get(record, 'role.name');
                },
            },
            type: {
                label: 'Type',
                sortable: false,
                format(record) {
                    return formatStrong(getModelType(record));
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
    handleFormProps(authUser, { result, ...extra }) {
        const input = {} as Input;
        for (const field of inputFields) {
            if (field === 'role') {
                copyField(input, result, field, {
                    id: '',
                    client_id: 0,
                    name: '',
                });
            } else if (field === 'type') {
                copyField(input, result, field, 'USER');
            } else {
                copyField(input, result, field, '');
            }
        }

        if (!input.client_id) {
            input.client_id = input.role.client_id || authUser.client_id;
        }

        if (input.type === 'SUPERADMIN') {
            input.client_id = 0;
        }

        return { input, ...extra };
    },
    listQuery: gql`
        query Users($query: String, $from: Int, $size: Int, $sort: String) {
            records: users(query: $query, from: $from, size: $size, sort: $sort) {
                ...UserFields
            }
            total: usersCount(query: $query)
        }
        ${fieldsFragment}
    `,
    updateQuery: gql`
        query UpdateQuery($id: ID!) {
            roles(query: "*", size: 10000) {
                id
                name
            }
            result: user(id: $id) {
                ...UserFields
            }
        }
        ${fieldsFragment}
    `,
    createQuery: gql`
        {
            roles(query: "*", size: 10000) {
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
