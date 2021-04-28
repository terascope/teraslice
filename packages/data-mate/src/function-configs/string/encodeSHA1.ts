import crypto, { BinaryToTextEncoding } from 'crypto';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    DataTypeFieldAndChildren,
    FunctionDefinitionCategory
} from '../interfaces';

export interface EncodeSHA1Config {
    digest?: string;
}

const defaultDigest = 'hex';

export const encodeSHA1Config: FieldTransformConfig<EncodeSHA1Config> = {
    name: 'encodeSHA1',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    description: 'Converts to a SHA1 encoded value',
    category: FunctionDefinitionCategory.STRING,
    create({ digest = defaultDigest } = {}) {
        return (input: unknown) => encodeSHA1(input, digest as BinaryToTextEncoding);
    },
    accepts: [],
    argument_schema: {
        digest: {
            type: FieldType.String,
            array: false,
            description: 'Which has digest to use, may be set to either "base64" or "hex", defaults to "hex"'
        }
    },
    output_type(inputConfig: DataTypeFieldAndChildren): DataTypeFieldAndChildren {
        const { field_config } = inputConfig;

        return {
            field_config: {
                ...field_config,
                type: FieldType.String
            }
        };
    }
};

export function encodeSHA1(input: unknown, digest: BinaryToTextEncoding = defaultDigest): string {
    return crypto.createHash('sha1').update(input as string).digest(digest);
}
