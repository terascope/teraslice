import gql from 'graphql-tag';
import { formatDate } from '@terascope/ui-components';
import { inputFields, Input } from './interfaces';
import { ModelConfig } from '../interfaces';
import { copyField } from '../utils';

const fieldsFragment = gql`
    fragment DataTypeFields on DataType {
        id
        client_id
        name
        description
        type_config
        created
        updated
    }
`;

const config: ModelConfig<Input> = {
    name: 'DataType',
    pathname: 'data-types',
    singularLabel: 'Data Type',
    pluralLabel: 'Data Types',
    searchFields: ['name'],
    requiredFields: ['name'],
    handleFormProps(authUser, { result, ...extra }) {
        const input = {} as Input;
        for (const field of inputFields) {
            if (field === 'type_config') {
                copyField(input, result, field, {
                    version: 1,
                    fields: {},
                });
                if (!input.type_config.fields || !input.type_config.version) {
                    input.type_config = {
                        version: 1,
                        fields: input.type_config,
                    };
                }
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
                ...DataTypeFields
            }
            total: dataTypesCount(query: $query)
        }
        ${fieldsFragment}
    `,
    updateQuery: gql`
        query UpdateQuery($id: ID!) {
            result: dataType(id: $id) {
                ...DataTypeFields
            }
        }
        ${fieldsFragment}
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
