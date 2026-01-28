import { DataTypeConfig, FieldType } from '@terascope/types';

export const executionDataTypeConfig: DataTypeConfig = {
    version: 1,
    fields: {
        // ExecutionConfig fields
        job_id: { type: FieldType.Keyword },
        ex_id: { type: FieldType.Keyword },
        _context: { type: FieldType.Keyword },
        _created: { type: FieldType.Date },
        _updated: { type: FieldType.Date },
        _deleted: { type: FieldType.Boolean },
        _deleted_on: { type: FieldType.Date },
        _status: { type: FieldType.Keyword },
        _has_errors: { type: FieldType.Boolean },
        _slicer_stats: { type: FieldType.Object },
        _failureReason: { type: FieldType.Text },
        metadata: { type: FieldType.Object, indexed: false },
        recovered_execution: { type: FieldType.Keyword },
        recovered_slice_type: { type: FieldType.Keyword },
        slicer_port: { type: FieldType.Integer },
        slicer_hostname: { type: FieldType.Keyword },
        teraslice_version: { type: FieldType.Keyword },
        // ValidatedJobConfig fields
        active: { type: FieldType.Boolean },
        analytics: { type: FieldType.Boolean },
        assets: { type: FieldType.Keyword },
        autorecover: { type: FieldType.Boolean },
        lifecycle: { type: FieldType.Keyword },
        max_retries: { type: FieldType.Integer },
        name: { type: FieldType.Text },
        probation_window: { type: FieldType.Integer },
        performance_metrics: { type: FieldType.Boolean },
        log_level: { type: FieldType.Keyword },
        slicers: { type: FieldType.Integer },
        workers: { type: FieldType.Integer },
        stateful: { type: FieldType.Boolean },
        // k8s field
        cpu: { type: FieldType.Float },
        cpu_execution_controller: { type: FieldType.Float },
        ephemeral_storage: { type: FieldType.Boolean },
        memory: { type: FieldType.Integer },
        memory_execution_controller: { type: FieldType.Integer },
        resources_requests_cpu: { type: FieldType.Float },
        resources_requests_memory: { type: FieldType.Integer },
        resources_limits_cpu: { type: FieldType.Float },
        resources_limits_memory: { type: FieldType.Integer },
        kubernetes_image: { type: FieldType.Keyword },
        prom_metrics_enabled: { type: FieldType.Boolean },
        prom_metrics_port: { type: FieldType.Integer },
        prom_metrics_add_default: { type: FieldType.Boolean }
    }
};
