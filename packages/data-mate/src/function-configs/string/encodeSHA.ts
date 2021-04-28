import crypto, { BinaryToTextEncoding } from 'crypto';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    DataTypeFieldAndChildren,
    FunctionDefinitionCategory
} from '../interfaces';

export interface EncodeSHAConfig {
    hash?: string;
    digest?: string;
}

const hashDefault = 'sha256';
const digestDefault = 'hex';

export const encodeSHAConfig: FieldTransformConfig<EncodeSHAConfig> = {
    name: 'encodeSHA',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Converts to a SHA encoded value',
    create({ hash = hashDefault, digest = digestDefault } = {}) {
        return (input: unknown) => encodeSHA(input, hash, digest as BinaryToTextEncoding);
    },
    accepts: [],
    argument_schema: {
        hash: {
            type: FieldType.String,
            array: false,
            description: 'Which has hashing algorithm to use, defaults to sha256'
        },
        digest: {
            type: FieldType.String,
            array: false,
            description: 'Which has digest to use, may be set to either "base64" or "hex", defaults to "hex"'
        }
    },
    output_type(inputConfig: DataTypeFieldAndChildren): DataTypeFieldAndChildren {
        const { field_config, child_config } = inputConfig;

        return {
            field_config: {
                ...field_config,
                type: FieldType.String
            },
            child_config
        };
    }
};

export function encodeSHA(
    input: unknown,
    hash: string = hashDefault,
    digest: BinaryToTextEncoding = digestDefault
): string {
    return crypto.createHash(hash).update(input as string).digest(digest);
}
