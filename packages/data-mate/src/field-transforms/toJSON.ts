import { isBigInt, bigIntToJSON, isNil } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    DataTypeFieldAndChildren
} from '../interfaces';

export const toJSONConfig: FieldTransformConfig = {
    name: 'toJSON',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.FULL_VALUES,
    description: 'converts input to JSON',
    create() {
        return (input: unknown) => {
            if (isNil(input)) return null;

            if (isBigInt(input)) {
                return bigIntToJSON(input);
            }

            return JSON.stringify(input as string);
        };
    },
    accepts: [],
    output_type(inputConfig: DataTypeFieldAndChildren): DataTypeFieldAndChildren {
        const { field_config } = inputConfig;

        return {
            field_config: {
                ...field_config,
                type: FieldType.String
            },
        };
    }
};
