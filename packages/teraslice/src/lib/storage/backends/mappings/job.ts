import { DataTypeConfig, FieldType } from '@terascope/types';

export const jobDataTypeConfig: DataTypeConfig = {
    version: 1,
    fields: {
        // JobConfig fields
        job_id: { type: FieldType.Keyword },
        _context: { type: FieldType.Keyword },
        _created: { type: FieldType.Date },
        _updated: { type: FieldType.Date },
        _deleted: { type: FieldType.Boolean },
        _deleted_on: { type: FieldType.Date },
        // ValidatedJobConfig fields
        active: { type: FieldType.Boolean },
        analytics: { type: FieldType.Boolean },
        assets: { type: FieldType.Keyword },
        assetIds: { type: FieldType.Keyword },
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
        // K8s fields
        cpu: { type: FieldType.Float },
        cpu_execution_controller: { type: FieldType.Float },
        ephemeral_storage: { type: FieldType.Boolean },
        memory: { type: FieldType.Integer },
        memory_execution_controller: { type: FieldType.Integer },
        resources_requests_cpu: { type: FieldType.Float },
        resources_requests_memory: { type: FieldType.Integer },
        resources_limits_cpu: { type: FieldType.Float },
        resources_limits_memory: { type: FieldType.Integer },
        kubernetes_image: { type: FieldType.Text },
        prom_metrics_enabled: { type: FieldType.Boolean },
        prom_metrics_port: { type: FieldType.Integer },
        prom_metrics_add_default: { type: FieldType.Boolean }
    }
};
