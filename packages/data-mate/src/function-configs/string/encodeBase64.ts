import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    DataTypeFieldAndChildren
} from '../interfaces';

export const encodeBase64Config: FieldTransformConfig = {
    name: 'encodeBase64',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    description: 'Converts value to a base64 hash',
    create() {
        return (input: unknown) => encodeBase64(input as string);
    },
    accepts: [FieldType.String],
    output_type(inputConfig: DataTypeFieldAndChildren): DataTypeFieldAndChildren {
        const { field_config, child_config } = inputConfig;
        // NOTE: encoding might need to mutate child_config
        return {
            field_config: {
                ...field_config,
                type: FieldType.String
            },
            child_config
        };
    }
};

export function encodeBase64(input: string): string {
    return Buffer.from(input as string).toString('base64');
}
