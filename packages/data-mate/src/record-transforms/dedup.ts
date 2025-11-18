/* eslint-disable @typescript-eslint/no-unused-vars */
import { FieldType } from '@terascope/types';
import {
    isNotNil, isObjectEntity,
    isEmpty, sortKeys, getTypeOf
} from '@terascope/core-utils';
// import { RecordTransformConfig, FunctionDefinitionType } from '../interfaces.js';

// export const dedupConfig: RecordTransformConfig = {
//     name: 'required',
//     type: FunctionDefinitionType.RECORD_TRANSFORM,
//     description: 'Verifies that a record has given fields',
//     // @ts-expect-error
//     create() {
//         // @ts-expect-error
//         return (input) => dedupe<Record<string, unknown>>(input);
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

// function dedupe<T = any>(input: (unknown| null)[]): T[] {
// if (!Array.isArray(input)) {
//    throw new Error(`Input must be an array, received ${getTypeOf(input)}`);
// }

//     const deduped = new Map<any, true>();
//     const results: T[] = [];

//     for (const value of input) {
//         if (isNotNil(value)) {
//             if (isObjectEntity(value) && !isEmpty(value)) {
//                 const sorted = sortKeys(value, { deep: true });
//                 const json = JSON.stringify(sorted);

//                 if (!deduped.has(json)) {
//                     results.push(value);
//                     deduped.set(json, true);
//                 }
//             } else if (!deduped.has(value)) {
//                 results.push(value);
//                 deduped.set(value, true);
//             }
//         }
//     }

//     return results;
// }
