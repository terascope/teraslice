import crypto, { BinaryToTextEncoding } from 'crypto';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    DataTypeFieldAndChildren
} from '../interfaces';

export interface EncodeSHA1Config {
    digest?: string;
}

export const encodeSHAConfig: FieldTransformConfig<EncodeSHA1Config> = {
    name: 'encodeSHA',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    description: 'Converts to a SHA encoded value',
    create({ digest = 'hex' } = {}) {
        return (input: unknown) => encodeBase(input, digest as BinaryToTextEncoding);
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

function encodeBase(input: unknown, digest: BinaryToTextEncoding) {
    return crypto.createHash('sha1').update(input as string).digest(digest);
}
