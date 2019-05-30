import gql from 'graphql-tag';
import { get } from '@terascope/utils';
import { formatDate } from '@terascope/ui-components';
import { inputFields, Input } from './interfaces';
import { ModelConfig } from '../interfaces';

const config: ModelConfig<Input> = {
    name: 'View',
    pathname: 'views',
    singularLabel: 'View',
    pluralLabel: 'Views',
    searchFields: ['name'],
    requiredFields: ['name'],
    handleFormProps(authUser, data) {
        const result = get(data, 'result');
        const input = {} as Input;
        for (const field of inputFields) {
            if (['includes', 'excludes'].includes(field)) {
                input[field] = get(result, field) || [];
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
            name: { label: 'View Name' },
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
        query Views($query: String, $from: Int, $size: Int, $sort: String) {
            records: views(query: $query, from: $from, size: $size, sort: $sort) {
                id
                name
                description
                updated
                created
            }
            total: viewsCount(query: $query)
        }
    `,
    updateQuery: gql`
        query UpdateQuery($id: ID!) {
            result: view(id: $id) {
                id
                name
                description
                excludes
                includes
                constraint
                client_id
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
