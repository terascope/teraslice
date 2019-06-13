import gql from 'graphql-tag';
import { get } from '@terascope/utils';
import { formatDate } from '@terascope/ui-components';
import { inputFields, Input } from './interfaces';
import { ModelConfig } from '../interfaces';
import { copyField } from '../utils';
import { LATEST_VERSION } from '@terascope/data-types';

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
            client_id
            name
            config {
                version
                fields
            }
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
            if (['includes', 'excludes'].includes(field)) {
                copyField(input, result, field, []);
            } else if (field === 'data_type') {
                copyField(input, result, field, {
                    id: '',
                    client_id: 0,
                    name: '',
                    config: {
                        version: LATEST_VERSION,
                        fields: {},
                    },
                });
            } else if (field === 'roles') {
                const defaultRoles = authUser.role ? [authUser.role] : [];
                copyField(input, result, field, defaultRoles);
            } else if (field === 'space') {
                copyField(input, result, 'space', {
                    id: '',
                    name: '',
                    roles: roles || [],
                });
            } else if (field === 'prevent_prefix_wildcard') {
                copyField(input, result, field, false);
            } else {
                copyField(input, result, field, '');
            }
        }

        const dataTypes = get(result, 'data_type') ? [result.data_type] : _dataTypes;
        if (!input.client_id) {
            input.client_id = input.data_type.client_id || authUser.client_id;
        }
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
                client_id
                name
                config {
                    version
                    fields
                }
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
