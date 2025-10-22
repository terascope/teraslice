/* eslint-disable @typescript-eslint/no-unused-vars */
import { FieldType } from '@terascope/types';
import { has, isNotNil } from '@terascope/core-utils';
// import { RecordValidationConfig, FunctionDefinitionType } from '../interfaces.js';

// export interface RequiredFieldsConfig {
//     fields: string[];
// }

// export const requiredConfig: RecordValidationConfig<RequiredFieldsConfig> = {
//     name: 'required',
//     type: FunctionDefinitionType.RECORD_VALIDATION,
//     description: 'Verifies that a record has given fields',
//     create({ fields }) {
//         return (input) => hasKeys(input, fields);
//     },
//     accepts: [FieldType.Object],
//     argument_schema: {
//         fields: {
//             type: FieldType.String,
//             array: true,
//             description: 'The list of fields that must be present on record'
//         }
//     },
//     required_arguments: ['fields'],
// };

// function hasKeys(data: Record<string, unknown>, fields: string[]): boolean {
//     return fields.every((field) => has(data, field) && isNotNil(data[field]));
// }
