import gql from 'graphql-tag';
import { ModelName } from '@terascope/data-access';
import { ModelConfigMapping } from './interfaces';
import { formatDate } from '@terascope/ui-components';
import { get } from '@terascope/utils';
import { Input as UserInput, inputFields as userInputFields, Role } from './Users/Form/interfaces';
import { Input as RoleInput, inputFields as roleInputFields } from './Roles/Form/interfaces';

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
        handleFormProps(authUser, data) {
            const user = get(data, 'user');
            const input = {} as UserInput;
            for (const field of userInputFields) {
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
            mutation User($input: CreateUserInput!, $password: String!) {
                result: createUser(user: $input, password: $password) {
                    id
                }
            }
        `,
        updateMutation: gql`
            mutation User($input: UpdateUserInput!, $password: String) {
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
    },
    Role: {
        pathname: 'roles',
        singularLabel: 'Role',
        pluralLabel: 'Roles',
        searchFields: ['name'],
        handleFormProps(authUser, data) {
            const role = get(data, 'role');
            const input = {} as RoleInput;
            for (const field of roleInputFields) {
                input[field] = get(role, field) || '';
            }
            if (!input.client_id && authUser.client_id) {
                input.client_id = authUser.client_id;
            }
            return { input };
        },
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
        createMutation: gql`
            mutation Role($input: CreateRoleInput!) {
                result: createRole(role: $input) {
                    id
                }
            }
        `,
        updateMutation: gql`
            mutation Role($input: UpdateRoleInput!) {
                result: updateRole(role: $input) {
                    id
                }
            }
        `,
        updateQuery: gql`
            query UpdateQuery($id: ID!) {
                role(id: $id) {
                    id
                    name
                    description
                    client_id
                }
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
        updateQuery: '',
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
        updateQuery: '',
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
        updateQuery: '',
        listQuery: '',
    },
};

export function getModelConfig(model: ModelName) {
    return MODEL_CONFIG[model];
}
