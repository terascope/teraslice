import { DataTypeConfig, FieldType } from '@terascope/types';

export const analyticsDataTypeConfig: DataTypeConfig = {
    version: 1,
    fields: {
        ex_id: { type: FieldType.Keyword },
        job_id: { type: FieldType.Keyword },
        worker_id: { type: FieldType.Keyword },
        slice_id: { type: FieldType.Keyword },
        slicer_id: { type: FieldType.Keyword },
        op: { type: FieldType.Keyword },
        order: { type: FieldType.Integer },
        count: { type: FieldType.Integer },
        state: { type: FieldType.Keyword },
        time: { type: FieldType.Integer },
        memory: { type: FieldType.Long },
        '@timestamp': { type: FieldType.Date }
    }
};

export const analyticsTemplate = '__analytics*';
