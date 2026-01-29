import { DataTypeConfig, FieldType } from '@terascope/types';

export const stateDataTypeConfig: DataTypeConfig = {
    version: 1,
    fields: {
        ex_id: { type: FieldType.Keyword },
        slice_id: { type: FieldType.Keyword },
        slicer_id: { type: FieldType.Keyword },
        slicer_order: { type: FieldType.Integer },
        state: { type: FieldType.Keyword },
        _created: { type: FieldType.Date },
        _updated: { type: FieldType.Date },
        error: { type: FieldType.Keyword }
    }
};

export const stateTemplate = '__state*';
