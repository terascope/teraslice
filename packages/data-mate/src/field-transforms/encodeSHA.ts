import crypto, { BinaryToTextEncoding } from 'crypto';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    DataTypeFieldAndChildren
} from '../interfaces';

export interface EncodeSHAConfig {
    hash?: string;
    digest?: string;
}

export const encodeSHAConfig: FieldTransformConfig<EncodeSHAConfig> = {
    name: 'encodeSHA',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    description: 'Converts to a SHA encoded value',
    create({ hash = 'sha256', digest = 'hex' } = {}) {
        return (input: unknown) => encodeBase(input, hash, digest as BinaryToTextEncoding);
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

function encodeBase(input: unknown, hash: string, digest: BinaryToTextEncoding) {
    return crypto.createHash(hash).update(input as string).digest(digest);
}
