import { DataTypeConfig, FieldType } from '@terascope/types';

export const executionDataTypeConfig: DataTypeConfig = {
    version: 1,
    fields: {
        active: { type: FieldType.Boolean },
        job_id: { type: FieldType.Keyword },
        ex_id: { type: FieldType.Keyword },
        _context: { type: FieldType.Keyword },
        _status: { type: FieldType.Keyword },
        _has_errors: { type: FieldType.Keyword },
        slicer_hostname: { type: FieldType.Keyword },
        slicer_port: { type: FieldType.Keyword },
        recovered_execution: { type: FieldType.Keyword },
        recovered_slice_type: { type: FieldType.Keyword },
        metadata: { type: FieldType.Object, indexed: false },
        _slicer_stats: { type: FieldType.Object },
        _created: { type: FieldType.Date },
        _updated: { type: FieldType.Date },
        _deleted: { type: FieldType.Boolean },
        _deleted_on: { type: FieldType.Date },
        teraslice_version: { type: FieldType.Keyword }
    }
};
