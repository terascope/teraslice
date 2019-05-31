import gql from 'graphql-tag';
import { formatDate } from '@terascope/ui-components';
import { inputFields, Input } from './interfaces';
import { ModelConfig } from '../interfaces';
import { copyField } from '../ModelForm/utils';

const fieldsFragment = gql`
    fragment SpaceFields on Space {
        client_id
        id
        name
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
            name
            views {
                id
                name
            }
        }
        search_config {
            index
            connection
            max_query_size
            sort_default
            sort_dates_only
            sort_enabled
            default_geo_field
            preserve_index_name
            require_query
            default_date_field
            enable_history
            history_prefix
        }
        updated
        created
    }
`;

const config: ModelConfig<Input> = {
    name: 'Space',
    pathname: 'spaces',
    singularLabel: 'Space',
    pluralLabel: 'Spaces',
    searchFields: ['name', 'endpoint'],
    requiredFields: ['name', 'endpoint'],
    handleFormProps(authUser, { result, views, ...extra }) {
        const input = {} as Input;
        for (const field of inputFields) {
            if (field === 'search_config') {
                copyField(input, result, field, {
                    index: '',
                    connection: 'default',
                    max_query_size: 10000,
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
                    name: '',
                    views,
                });
            } else {
                copyField(input, result, field, '');
            }
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
            endpoint: { label: 'Endpoint' },
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
