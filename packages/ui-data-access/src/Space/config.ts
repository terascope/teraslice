import gql from 'graphql-tag';
import { formatDate } from '@terascope/ui-components';
import { get, trimAndToUpper } from '@terascope/utils';
import { SpaceConfigType } from '@terascope/data-access';
import { inputFields, Input } from './interfaces';
import { ModelConfig } from '../interfaces';
import { formatStrong } from '../ModelList/Strong';
import { copyField } from '../utils';

const fieldsFragment = gql`
    fragment SpaceFields on Space {
        client_id
        id
        name
        type
        description
        endpoint
        views {
            id
            name
        }
        roles {
            id
            name
        }
        data_type {
            id
            client_id
            name
            views {
                id
                name
            }
        }
        config
        updated
        created
    }
`;

const config: ModelConfig<Input> = {
    name: 'Space',
    pathname: 'spaces',
    singularLabel: 'Space',
    pluralLabel: 'Spaces',
    searchFields: ['name', 'type', 'endpoint'],
    requiredFields: ['name', 'type', 'endpoint'],
    handleFormProps(authUser, { result, views, dataTypes: _dataTypes, ...extra }) {
        const input = {} as Input;
        for (const field of inputFields) {
            if (field === 'config') {
                copyField(input, result, field, {
                    index: '',
                    connection: 'default',
                    max_query_size: 100000,
                    sort_dates_only: false,
                    preserve_index_name: false,
                    require_query: false,
                    enable_history: false,
                });
            } else if (['views', 'roles'].includes(field)) {
                copyField(input, result, field, []);
            } else if (field === 'data_type') {
                copyField(input, result, field, {
                    id: '',
                    client_id: 0,
                    name: '',
                    views,
                });
            } else if (field === 'type') {
                copyField(input, result, field, 'SEARCH');
                input.type = trimAndToUpper(input.type) as SpaceConfigType;
            } else {
                copyField(input, result, field, '');
            }
        }

        if (!input.client_id) {
            input.client_id = input.data_type.client_id || authUser.client_id;
        }

        const dataTypes = get(result, 'data_type') ? [get(result, 'data_type')] : _dataTypes;
        if (!input.client_id) {
            input.client_id = input.data_type.client_id;
        }
        return { input, dataTypes, ...extra };
    },
    rowMapping: {
        getId(record) {
            return record.id!;
        },
        columns: {
            name: { label: 'Name' },
            endpoint: { label: 'API Endpoint' },
            type: {
                label: 'Configuration Type',
                format(record) {
                    return formatStrong(record.type);
                },
            },
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
        query Spaces($query: String, $from: Int, $size: Int, $sort: String) {
            records: spaces(query: $query, from: $from, size: $size, sort: $sort) {
                ...SpaceFields
            }
            total: spacesCount(query: $query)
        }
        ${fieldsFragment}
    `,
    updateQuery: gql`
        query UpdateQuery($id: ID!) {
            roles(query: "*") {
                id
                name
            }
            dataTypes(query: "*") {
                id
                client_id
                name
            }
            result: space(id: $id) {
                ...SpaceFields
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
            }
            views(query: "*") {
                id
                name
            }
        }
    `,
    createMutation: gql`
        mutation CreateSpace($input: CreateSpaceInput!) {
            result: createSpace(space: $input) {
                id
            }
        }
    `,
    updateMutation: gql`
        mutation UpdateSpace($input: UpdateSpaceInput!) {
            result: updateSpace(space: $input) {
                id
            }
        }
    `,
    removeMutation: gql`
        mutation RemoveSpace($id: ID!) {
            result: removeSpace(id: $id)
        }
    `,
};

export default config;
