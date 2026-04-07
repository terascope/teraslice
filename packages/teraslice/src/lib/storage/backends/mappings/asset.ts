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
        blob: { type: FieldType.Binary },
        _created: { type: FieldType.Date }
    }
};
