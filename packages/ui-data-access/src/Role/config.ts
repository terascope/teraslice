import gql from 'graphql-tag';
import { get } from '@terascope/utils';
import { formatDate } from '@terascope/ui-components';
import { inputFields, Input } from './interfaces';
import { ModelConfig } from '../interfaces';

const config: ModelConfig<Input> = {
    name: 'Role',
    pathname: 'roles',
    singularLabel: 'Role',
    pluralLabel: 'Roles',
    searchFields: ['name'],
    requiredFields: ['name'],
    handleFormProps(authUser, data) {
        const result = get(data, 'result');
        const input = {} as Input;
        for (const field of inputFields) {
            input[field] = get(result, field) || '';
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
    updateQuery: gql`
        query UpdateQuery($id: ID!) {
            result: role(id: $id) {
                id
                name
                description
                client_id
            }
        }
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
