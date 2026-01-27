import { DataTypeConfig, FieldType } from '@terascope/types';

export const jobDataTypeConfig: DataTypeConfig = {
    version: 1,
    fields: {
        active: { type: FieldType.Boolean },
        job_id: { type: FieldType.Keyword },
        _context: { type: FieldType.Keyword },
        _created: { type: FieldType.Date },
        _updated: { type: FieldType.Date },
        _deleted: { type: FieldType.Boolean },
        _deleted_on: { type: FieldType.Date }
    }
};
