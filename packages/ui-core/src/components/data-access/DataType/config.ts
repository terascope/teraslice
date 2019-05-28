import gql from 'graphql-tag';
import { get } from '@terascope/utils';
import { formatDate } from '@terascope/ui-components';
import { inputFields, Input } from './Form/interfaces';
import { ModelConfig } from '../interfaces';

const config: ModelConfig = {
    name: 'DataType',
    pathname: 'data-types',
    singularLabel: 'Data Type',
    pluralLabel: 'Data Types',
    searchFields: ['name'],
    requiredFields: ['name'],
    handleFormProps(authUser, data) {
        const dataTypes = get(data, 'dataType');
        const input = {} as Input;
        for (const field of inputFields) {
            if (field === 'type_config') {
                input[field] = get(dataTypes, field) || {};
            } else {
                input[field] = get(dataTypes, field) || '';
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
            name: { label: 'Data Type Name' },
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
        query DataTypes($query: String, $from: Int, $size: Int, $sort: String) {
            records: dataTypes(query: $query, from: $from, size: $size, sort: $sort) {
                id
                name
                description
                type_config
                updated
                created
            }
            total: dataTypesCount(query: $query)
        }
    `,
    updateQuery: gql`
        query UpdateQuery($id: ID!) {
            dataType(id: $id) {
                id
                name
                description
                type_config
                client_id
            }
        }
    `,
    createMutation: gql`
        mutation CreateDataType($input: CreateDataTypeInput!) {
            result: createDataType(dataType: $input) {
                id
            }
        }
    `,
    updateMutation: gql`
        mutation UpdateDataType($input: UpdateDataTypeInput!) {
            result: updateDataType(dataType: $input) {
                id
            }
        }
    `,
    removeMutation: gql`
        mutation RemoveDataType($id: ID!) {
            result: removeDataType(id: $id)
        }
    `,
};

export default config;
