import { DataTypeConfig, FieldType } from '@terascope/types';

export const assetDataTypeConfig: DataTypeConfig = {
    version: 1,
    fields: {
        name: { type: FieldType.Keyword },
        version: { type: FieldType.Keyword },
        id: { type: FieldType.Keyword },
        description: { type: FieldType.Keyword },
        arch: { type: FieldType.Keyword },
        platform: { type: FieldType.Keyword },
        node_version: { type: FieldType.Integer },
        _created: { type: FieldType.Date }
    }
};

/**
 * Override for the blob field which uses ES binary type.
 * I could not find the datatype equivalent
 * so we must add this field manually via mapping overrides.
 * Once the issue below is resolved we can remove this.
 * https://github.com/terascope/teraslice/issues/4296
 */
export const assetMappingOverrides = {
    mappings: {
        properties: {
            blob: {
                type: 'binary',
                doc_values: false
            }
        }
    }
};
