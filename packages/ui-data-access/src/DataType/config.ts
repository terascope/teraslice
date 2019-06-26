import gql from 'graphql-tag';
import { get } from '@terascope/utils';
import { DataType } from '@terascope/data-access';
import { formatDate } from '@terascope/ui-components';
import { LATEST_VERSION, DataTypeConfig, TypeConfigFields } from '@terascope/data-types';
import { inputFields, Input } from './interfaces';
import { ModelConfig } from '../interfaces';
import { copyField } from '../utils';

const fieldsFragment = gql`
    fragment DataTypeFields on DataType {
        id
        client_id
        name
        description
        inherit_from
        config {
            version
            fields
        }
        resolved_config {
            version
            fields
        }
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
    handleFormProps(authUser, { result, dataTypes: _dataTypes }) {
        const input = {} as Input;
        for (const field of inputFields) {
            if (field === 'config') {
                copyField(input, result, field, {
                    version: LATEST_VERSION,
                    fields: {},
                });
            } else if (field === 'inherit_from') {
                copyField(input, result, field, []);
            } else {
                copyField(input, result, field, '');
            }
        }

        const resolvedConfig: DataTypeConfig = get(result, 'resolved_config', {
            version: LATEST_VERSION,
            fields: {},
        });

        const resolvedFields: TypeConfigFields = {};
        const existing = Object.keys(input.config.fields);
        for (const [field, type] of Object.entries(resolvedConfig.fields)) {
            if (!existing.includes(field)) {
                resolvedFields[field] = type;
            }
        }
        resolvedConfig.fields = resolvedFields;

        const dataTypes = (_dataTypes || []).filter(({ id }: DataType) => {
            return id !== input.id;
        });

        if (!input.client_id && authUser.client_id) {
            input.client_id = authUser.client_id;
        }

        return { input, resolvedConfig, dataTypes };
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
            dataTypes(size: 1000) {
                id
                client_id
                name
                config {
                    version
                    fields
                }
            }
        }
        ${fieldsFragment}
    `,
    createQuery: gql`
        {
            dataTypes(size: 10000) {
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
