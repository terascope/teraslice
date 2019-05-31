import gql from 'graphql-tag';
import { get } from '@terascope/utils';
import { formatDate } from '@terascope/ui-components';
import { inputFields, Input } from './interfaces';
import { ModelConfig } from '../interfaces';

const fieldsFragment = gql`
    fragment ViewFields on View {
        id
        client_id
        name
        description
        excludes
        includes
        constraint
        prevent_prefix_wildcard
        data_type {
            id
            name
            type_config
        }
        roles {
            id
            name
        }
        space {
            id
            name
            roles {
                id
                name
            }
        }
        updated
        created
    }
`;

const config: ModelConfig<Input> = {
    name: 'View',
    pathname: 'views',
    singularLabel: 'View',
    pluralLabel: 'Views',
    searchFields: ['name'],
    requiredFields: ['name'],
    handleFormProps(authUser, { result, roles, dataTypes: _dataTypes, ...extra }) {
        const input = {} as Input;
        for (const field of inputFields) {
            if (field === 'includes') {
                input.includes = get(result, 'includes', []);
            } else if (field === 'excludes') {
                input.excludes = get(result, 'excludes', []);
            } else if (field === 'data_type') {
                input.data_type = get(result, 'data_type', {
                    id: '',
                    name: '',
                    type_config: {},
                });
            } else if (field === 'roles') {
                input.roles = get(result, 'roles', []);
            } else if (field === 'space') {
                input.space = get(result, 'space', {
                    id: '',
                    name: '',
                    roles: roles || [],
                });
            } else if (field === 'prevent_prefix_wildcard') {
                input.prevent_prefix_wildcard = get(result, 'prevent_prefix_wildcard') || false;
            } else {
                input[field] = get(result, field, '') as any;
            }
        }
        if (!input.client_id && authUser.client_id) {
            input.client_id = authUser.client_id;
        }
        const dataTypes = get(result, 'data_type') ? [get(result, 'data_type')] : _dataTypes;
        return { input, dataTypes, ...extra };
    },
    rowMapping: {
        getId(record) {
            return record.id;
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
            space: {
                label: 'space',
                sortable: false,
                format(record) {
                    return get(record, 'space.name');
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
        query Views($query: String, $from: Int, $size: Int, $sort: String) {
            records: views(query: $query, from: $from, size: $size, sort: $sort) {
                ...ViewFields
            }
            total: viewsCount(query: $query)
        }
        ${fieldsFragment}
    `,
    updateQuery: gql`
        query UpdateQuery($id: ID!) {
            result: view(id: $id) {
                ...ViewFields
            }
        }
        ${fieldsFragment}
    `,
    createQuery: gql`
        {
            roles(query: "*") {
                id
                name
            }
            dataTypes(query: "*") {
                id
                name
                type_config
            }
        }
    `,
    createMutation: gql`
        mutation CreateView($input: CreateViewInput!) {
            result: createView(view: $input) {
                id
            }
        }
    `,
    updateMutation: gql`
        mutation UpdateView($input: UpdateViewInput!) {
            result: updateView(view: $input) {
                id
            }
        }
    `,
    removeMutation: gql`
        mutation RemoveView($id: ID!) {
            result: removeView(id: $id)
        }
    `,
};

export default config;
