import gql from 'graphql-tag';
import { get } from '@terascope/utils';
import { formatDate } from '@terascope/ui-components';
import { inputFields, Input } from './interfaces';
import { ModelConfig } from '../interfaces';

const fieldsFragment = gql`
    fragment SpaceFields on Space {
        client_id
        id
        name
        description
        views {
            id
            name
        }
        roles {
            id
            name
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
    searchFields: ['name'],
    requiredFields: ['name'],
    handleFormProps(authUser, data) {
        const result = get(data, 'result');
        const input = {} as Input;
        for (const field of inputFields) {
            if (field === 'search_config') {
                input[field] = get(result, field) || {};
            } else if (['roles', 'views'].includes(field)) {
                const arr = get(result, field) || [];
                type ArrVal = { id: string } | string;
                input[field] = arr.map((o: ArrVal) => get(o, 'id', o)).filter((s: string) => !!s);
            } else {
                input[field] = get(result, field) || '';
            }
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
            name: { label: 'Space Name' },
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
            result: space(id: $id) {
                ...SpaceFields
            }
        }
        ${fieldsFragment}
    `,
    createQuery: gql`
        query CreateQuery($id: ID!) {
            result: space(id: $id) {
                ...SpaceFields
            }
        }
        ${fieldsFragment}
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
