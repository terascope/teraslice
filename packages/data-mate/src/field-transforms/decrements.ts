import { getTypeOf, isString, isBigInt } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    DataTypeFieldAndChildren
} from '../interfaces';

export interface DecrementArgs {
    by?: number
}

export const decrementConfig: FieldTransformConfig<DecrementArgs> = {
    name: 'decrement',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    description: 'Decrement a numeric value',
    // @ts-expect-error
    create({ by = 1 } = {}, inputConfig) {
        // if (inputConfig?.field_config.type === FieldType) {

        // }
        //  return () => return false;
    },
    accepts: [FieldType.String],
};
