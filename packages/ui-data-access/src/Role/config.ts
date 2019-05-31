import gql from 'graphql-tag';
import { formatDate } from '@terascope/ui-components';
import { inputFields, Input } from './interfaces';
import { ModelConfig } from '../interfaces';
import { copyField } from '../ModelForm/utils';

const fieldsFragment = gql`
    fragment RoleFields on Role {
        id
        client_id
        name
        description
        created
        updated
    }
`;

const config: ModelConfig<Input> = {
    name: 'Role',
    pathname: 'roles',
    singularLabel: 'Role',
    pluralLabel: 'Roles',
    searchFields: ['name'],
    requiredFields: ['name'],
    handleFormProps(authUser, { result, ...extra }) {
        const input = {} as Input;
        for (const field of inputFields) {
            copyField(input, result, field, '');
        }
        if (!input.client_id && authUser.client_id) {
            input.client_id = authUser.client_id;
        }
        return { input, ...extra };
    },
    rowMapping: {
        getId(record) {
            return record.id!;
        },
        columns: {
            name: { label: 'Name' },
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
                ...RoleFields
            }
            total: rolesCount(query: $query)
        }
        ${fieldsFragment}
    `,
    updateQuery: gql`
        query UpdateQuery($id: ID!) {
            result: role(id: $id) {
                ...RoleFields
            }
        }
        ${fieldsFragment}
    `,
    createMutation: gql`
        mutation CreateRole($input: CreateRoleInput!) {
            result: createRole(role: $input) {
                id
            }
        }
    `,
    updateMutation: gql`
        mutation UpdateRole($input: UpdateRoleInput!) {
            result: updateRole(role: $input) {
                id
            }
        }
    `,
    removeMutation: gql`
        mutation RemoveRole($id: ID!) {
            result: removeRole(id: $id)
        }
    `,
};

export default config;
