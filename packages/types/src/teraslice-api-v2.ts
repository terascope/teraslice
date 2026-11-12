import { z } from 'zod';
import {
    DataEncoding, ExecutionStatusEnum, ProcessAssignment, RecoveryCleanupType,
    type ExecutionStatus
} from './teraslice.js';

/** ############ V2 ROUTE SCHEMAS ############ */

/** ################### / #################### */

/** Response of `GET /` */
export const ClusterInfoSchema = z.object({
    arch: z.string().meta({ description: 'CPU architecture of the cluster master, e.g. "x64"' }),
    clustering_type: z.enum(['native', 'kubernetesV2']),
    name: z.string().meta({ description: 'The cluster name' }),
    node_version: z.string(),
    platform: z.string().meta({ description: 'OS platform of the cluster master, e.g. "linux"' }),
    teraslice_version: z.string().meta({ description: 'Prefixed with "v", e.g. "v3.1.0"' }),
}).meta({ id: 'ClusterInfo' });

/** ################ /cluster ################ */

/** ################# /state ################# */

export const ProcessNodeSchema = z.object({
    worker_id: z.union([z.string(), z.number()])
        .meta({ description: 'native: the node cluster worker id; kubernetesV2: the pod name' }),
    assignment: z.enum(ProcessAssignment),
    pid: z.number().optional()
        .meta({ description: 'native only' }),
    ex_id: z.string().optional()
        .meta({ description: 'Set on execution_controller and worker processes' }),
    job_id: z.string().optional()
        .meta({ description: 'Set on execution_controller and worker processes' }),
    assets: z.array(z.string()).optional()
        .meta({ description: 'Ids of the assets loaded by the process' }),
    image: z.string().optional()
        .meta({ description: 'kubernetesV2 only' }),
    pod_name: z.string().optional()
        .meta({ description: 'kubernetesV2 only' }),
    pod_ip: z.string().optional()
        .meta({ description: 'kubernetesV2 only' }),
}).meta({
    id: 'ProcessNode',
    description: 'A teraslice process running on a node',
});

const NotAvailable = z.literal('N/A');

const naOnK8s = '"N/A" on kubernetesV2';

export const NodeStateSchema = z.object({
    node_id: z.string().meta({ description: 'kubernetesV2: the host IP' }),
    hostname: z.string().meta({ description: 'kubernetesV2: the host IP' }),
    pid: z.union([z.number(), NotAvailable])
        .meta({ description: `Node master process id. ${naOnK8s}` }),
    node_version: z.string().meta({ description: naOnK8s }),
    teraslice_version: z.string().meta({ description: naOnK8s }),
    total: z.union([z.number(), NotAvailable])
        .meta({ description: `Worker capacity of the node. ${naOnK8s}` }),
    state: z.string()
        .meta({ description: '"connected" or "disconnected"; always "connected" on kubernetesV2' }),
    available: z.union([z.number(), NotAvailable])
        .meta({ description: `Free worker slots on the node. ${naOnK8s}` }),
    active: z.array(ProcessNodeSchema),
}).meta({ id: 'NodeState' });

/** Response of `GET /cluster/state` */
export const ClusterStateSchema = z.record(z.string(), NodeStateSchema).meta({
    id: 'ClusterState',
    description: 'Node state keyed by node id',
});

/** ################# /stats ################# */

/**
 * Cluster-wide totals. Each execution controller periodically pushes how much
 * its counters changed since its last push, and the cluster master adds those
 * diffs together in memory. The descriptions here are for the totals;
 * `ControllerStatsSchema` overrides them with per-execution meanings.
 */
export const AggregatedExecutionAnalyticsSchema = z.object({
    processed: z.number()
        .meta({ description: 'Slices completed, including failed ones, by all executions' }),
    failed: z.number().meta({ description: 'Slices that failed, across all executions' }),
    queued: z.number()
        .meta({ description: 'Slices currently waiting in the queue, across running executions' }),
    job_duration: z.number().meta({
        description: 'Sum of the run times, in seconds, of every execution that has finished',
    }),
    workers_joined: z.number()
        .meta({ description: 'Times a worker has connected, across all executions' }),
    workers_reconnected: z.number()
        .meta({ description: 'Times a worker has reconnected, across all executions' }),
    workers_disconnected: z.number()
        .meta({ description: 'Times a worker has disconnected, across all executions' }),
}).meta({
    id: 'AggregatedExecutionAnalytics',
    description: 'Totals since the cluster master started; they reset when it restarts. '
        + 'An execution\'s counts are added when its controller reports them, so they can '
        + 'lag by up to the analytics rate.',
});

/** Response of `GET /cluster/stats` */
export const ClusterStatsSchema = z.object({
    controllers: AggregatedExecutionAnalyticsSchema,
}).meta({ id: 'ClusterStats' });

/** ############## /controllers ############## */

export const ControllerStatsSchema = AggregatedExecutionAnalyticsSchema.extend({
    ex_id: z.string(),
    job_id: z.string(),
    name: z.string().meta({ description: 'The job name' }),
    workers_available: z.number()
        .meta({ description: 'Connected workers waiting for a slice' }),
    workers_active: z.number().meta({ description: 'Workers processing a slice' }),
    subslices: z.number().meta({ description: 'Times the slicer split a slice by id' }),
    slice_range_expansion: z.number()
        .meta({ description: 'Times the slicer expanded a slice range' }),
    slicers: z.number().meta({ description: 'Slicers registered for the execution' }),
    subslice_by_key: z.number()
        .meta({ description: 'Times the slicer split a slice by key' }),
    started: z.string().optional()
        .meta({ description: 'ISO 8601 timestamp, unset until the execution starts' }),
    queuing_complete: z.string().optional()
        .meta({ description: 'ISO 8601 timestamp, unset until all slices are queued' }),

    // Overrides: the AggregatedExecutionAnalytics fields, redescribed for a
    // single execution. Same types; they keep their base position in the output.
    processed: z.number().meta({ description: 'Slices completed, including failed ones' }),
    failed: z.number().meta({ description: 'Slices that failed' }),
    queued: z.number().meta({ description: 'Slices currently waiting in the queue' }),
    job_duration: z.number()
        .meta({ description: 'Run time in seconds, set when the execution finishes; 0 until then' }),
    workers_joined: z.number().meta({ description: 'Times a worker has connected' }),
    workers_reconnected: z.number().meta({ description: 'Times a worker has reconnected' }),
    workers_disconnected: z.number().meta({ description: 'Times a worker has disconnected' }),
}).meta({
    id: 'ControllerStats',
    description: 'Live statistics from a running execution controller',
});

/** Response of `GET /cluster/controllers` */
export const ControllerStatsListSchema = z.array(ControllerStatsSchema);

export type ControllerStatsList = z.output<typeof ControllerStatsListSchema>;

/** ############## /job-schema ############### */

const JSONSchemaNode = z.record(z.string(), z.unknown());

/**
 * The fixed envelope of the generated job JSON Schema. The contents of
 * `properties` and `definitions` depend on the cluster's job schema and
 * connectors, so they're left open. Loose because it's a JSON Schema
 * document, which may gain keywords without that being a breaking change.
 */
export const JobJSONSchemaSchema = z.looseObject({
    $schema: z.string().meta({ description: 'The JSON Schema draft, currently draft-07' }),
    $id: z.string().meta({ description: 'A stable URI for the schema' }),
    title: z.string(),
    description: z.string(),
    type: z.literal('object'),
    properties: z.record(z.string(), JSONSchemaNode)
        .meta({ description: 'One JSON Schema per top-level job field' }),
    required: z.array(z.string()),
    additionalProperties: z.boolean(),
    definitions: z.object({
        operation: JSONSchemaNode.meta({ description: 'Schema for an entry in `operations`' }),
        api: JSONSchemaNode.meta({ description: 'Schema for an entry in `apis`' }),
    }),
}).meta({
    id: 'JobJSONSchema',
    description: 'JSON Schema (draft-07) for a job config on this cluster',
});

/** Response of `GET /cluster/job-schema` */
export const JobSchemaResponseSchema = z.object({
    version: z.string().meta({ description: 'Teraslice version, without a "v" prefix' }),
    job_schema: JobJSONSchemaSchema,
}).meta({ id: 'JobSchemaResponse' });

/** ############## /connectors ############### */

export const ConnectorInfoSchema = z.object({
    type: z.string(),
    name: z.string(),
    is_state_cluster: z.boolean().optional()
        .meta({
            description: 'Only set on connections of the state storage connector type; '
                + 'true for the connector teraslice uses for state',
        }),
    is_asset_store: z.boolean().optional()
        .meta({
            description: 'Only set on connections of the asset storage connector type; '
                + 'true for the connector teraslice stores assets in',
        }),
}).meta({
    id: 'ConnectorInfo',
    description: 'A configured terafoundation connection',
});

export const GroupedConnectorsSchema = z.record(z.string(), z.array(z.string())).meta({
    id: 'GroupedConnectors',
    description: 'Connection names keyed by connector type',
});

/** Response of `GET /cluster/connectors` */
export const ConnectorListResponseSchema = z.object({
    connectors: z.union([z.array(ConnectorInfoSchema), GroupedConnectorsSchema]),
}).meta({ id: 'ConnectorListResponse' });

/** Query of `GET /cluster/connectors` */
export const GetClusterConnectorsQuerySchema = z.strictObject({
    type: z.string().optional()
        .meta({ description: 'Only return connectors of this type' }),
    name: z.string().optional()
        .meta({ description: 'Only return connections with this name' }),
    groupBy: z.enum(['type']).optional()
        .meta({
            description: 'Return connection names grouped by connector type'
        }),
});

export type GetClusterConnectorsQuery = z.input<typeof GetClusterConnectorsQuerySchema>;

/** ####### Job and execution records ######## */

/** ISO 8601 timestamp. Stored records are JSON, so these are never Dates. */
const Timestamp = z.string().meta({ description: 'ISO 8601 timestamp' });

const k8sOnly = (description?: string) => ({
    description: description ? `kubernetesV2 only. ${description}` : 'kubernetesV2 only'
});

/**
 * A kubernetesV2 job field marked `deprecated` in the job schema. Sets the
 * JSON Schema `deprecated` keyword, which the job schema's generated JSON
 * Schema also sets, and names the replacement field.
 */
const k8sDeprecated = (replacement: string) => ({
    ...k8sOnly(`Deprecated: use \`${replacement}\` instead`),
    deprecated: true,
});

const assetDefinedOptions = 'Options beyond these depend on the asset';

export const LogLevelSchema = z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])
    .meta({ id: 'LogLevel' });

export const OpConfigSchema = z.looseObject({
    _op: z.string().meta({ description: 'The operation name' }),
    _api_name: z.string().optional()
        .meta({ description: 'The name of the api used by this operation' }),
    _connection: z.string().optional()
        .meta({ description: 'A connection configured on the cluster that this operation will use' }),
    _encoding: z.enum(DataEncoding).optional(),
    _dead_letter_action: z.string().optional()
        .meta({ description: '"throw", "log", "none", or the name of a dead letter queue api' }),
}).meta({
    id: 'OpConfig',
    description: `An operation (reader, processor or sender). ${assetDefinedOptions}`,
});

export const APIConfigSchema = z.looseObject({
    _name: z.string().meta({ description: 'Unique api name, may be namespaced, e.g. "example:0"' }),
    _connection: z.string().optional()
        .meta({ description: 'A connection configured on the cluster that this api will use' }),
    _encoding: z.enum(DataEncoding).optional(),
    _dead_letter_action: z.string().optional()
        .meta({ description: '"throw", "log", "none", or the name of a dead letter queue api' }),
}).meta({
    id: 'APIConfig',
    description: `An api or observer. ${assetDefinedOptions}`,
});

/**
 * The job config fields, shared by job and execution records. `assets`,
 * `labels` and `log_level` default to `null` in the job schema, so records can
 * hold `null` there.
 *
 * Most fields have no description on purpose. Each one already has a `doc`
 * string in the job schema (`jobSchema` in job-components' `job-schemas.ts`),
 * which `GET /cluster/job-schema` serves; copying them here would let the two
 * drift apart. Descriptions are added only for what the job schema doesn't
 * already say for itself:
 * - "kubernetesV2 only": the job schema is built per cluster and simply leaves
 *   these fields out on native clusters, so it never needs to say this. This
 *   schema is static and lists them for every cluster.
 * - `targets[].constraint`: the job schema doesn't describe it at all.
 * - deprecations (`cpu`, `memory`): mirrored so the response schema marks them
 *   `deprecated` too, with the replacement field named.
 */
const jobConfigShape = {
    name: z.string(),
    active: z.boolean(),
    analytics: z.boolean(),
    assets: z.array(z.string()).nullable(),
    autorecover: z.boolean().optional(),
    lifecycle: z.enum(['once', 'persistent']),
    max_retries: z.number(),
    operations: z.array(OpConfigSchema),
    apis: z.array(APIConfigSchema),
    probation_window: z.number(),
    env_vars: z.record(z.string(), z.string()),
    log_level: LogLevelSchema.nullable().optional(),
    slicers: z.number(),
    workers: z.number(),
    stateful: z.boolean().optional(),
    labels: z.record(z.string(), z.string()).nullable()
        .optional()
        .meta(k8sOnly()),
    targets: z.array(z.object({
        key: z.string(),
        value: z.string(),
        constraint: z.enum(['required', 'preferred', 'accepted']).optional()
            .meta({
                description: '"required" (the default): only schedule on matching nodes; '
                    + '"preferred": favor matching nodes; '
                    + '"accepted": tolerate matching node taints',
            }),
    })).optional()
        .meta(k8sOnly()),
    cpu: z.number().optional()
        .meta(k8sDeprecated('resources_requests_cpu')),
    cpu_execution_controller: z.number().optional()
        .meta(k8sOnly()),
    ephemeral_storage: z.boolean().optional()
        .meta(k8sOnly()),
    external_ports: z.array(
        z.union([z.number(), z.object({ name: z.string(), port: z.number() })])
    ).optional()
        .meta(k8sOnly()),
    memory: z.number().optional()
        .meta(k8sDeprecated('resources_requests_memory')),
    memory_execution_controller: z.number().optional()
        .meta(k8sOnly()),
    pod_spec_override: z.record(z.string(), z.unknown()).optional()
        .meta(k8sOnly()),
    resources_requests_cpu: z.number().optional()
        .meta(k8sOnly()),
    resources_requests_memory: z.number().optional()
        .meta(k8sOnly()),
    resources_limits_cpu: z.number().optional()
        .meta(k8sOnly()),
    resources_limits_memory: z.number().optional()
        .meta(k8sOnly()),
    volumes: z.array(z.object({ name: z.string(), path: z.string() })).optional()
        .meta(k8sOnly()),
    kubernetes_image: z.string().optional()
        .meta(k8sOnly()),
    prom_metrics_enabled: z.boolean().optional()
        .meta(k8sOnly()),
    prom_metrics_port: z.number().optional()
        .meta(k8sOnly()),
    prom_metrics_add_default: z.boolean().optional()
        .meta(k8sOnly()),
    relocatable: z.boolean().optional()
        .meta(k8sOnly('Set by the system when the execution starts')),
};

const recordShape = {
    job_id: z.string(),
    _created: Timestamp,
    _updated: Timestamp,
    _deleted: z.boolean().optional()
        .meta({ description: 'Set when the record is soft deleted' }),
    _deleted_on: Timestamp.optional()
        .meta({ description: 'ISO 8601 timestamp of the soft delete' }),
};

const jobConfigDocs = 'Job config fields are documented by `GET /cluster/job-schema`.';

/**
 * Built from the enum's keys (equal to its values) rather than from the enum
 * itself: `z.enum(ExecutionStatusEnum)` would output the TS enum type, which
 * the plain string `ExecutionStatus` values on stored records don't satisfy.
 */
export const ExecutionStatusSchema = z.enum(Object.keys(ExecutionStatusEnum) as ExecutionStatus[])
    .meta({ id: 'ExecutionStatus' });

/**
 * Loose because records carry fields this schema doesn't list. Job validation
 * only warns about undeclared top-level keys (`SchemaValidator`'s
 * `checkUndeclaredKeys` defaults to `'warn'`), and the submitted job spec is
 * stored as-is, so whatever extra keys a client sends are kept. An execution
 * is built from that spec merged with the validated config, so it keeps them
 * too.
 *
 * Response of `GET /jobs/:jobId/ex` and `GET /ex/:exId`
 */
export const ExecutionRecordSchema = z.looseObject({
    ...jobConfigShape,
    ...recordShape,
    ex_id: z.string(),
    _context: z.literal('ex'),
    _status: ExecutionStatusSchema,
    _has_errors: z.boolean()
        .meta({ description: 'Whether the execution ended with an error' }),
    _failureReason: z.string().optional()
        .meta({ description: 'The error message; "" when `_has_errors` is false' }),
    _slicer_stats: z.record(z.string(), z.unknown()).meta({
        description: 'Snapshot of the execution controller stats (see ControllerStats), '
            + 'saved when the execution stops; {} until then',
    }),
    metadata: z.record(z.string(), z.unknown())
        .meta({ description: 'Arbitrary data saved by the job\'s operations, e.g. slicer state' }),
    recovered_execution: z.string().optional()
        .meta({ description: 'The ex_id this execution was recovered from' }),
    recovered_slice_type: z.enum(RecoveryCleanupType).optional()
        .meta({ description: 'The cleanup type used when recovering, if this is a recovery' }),
    slicer_port: z.number().optional()
        .meta({ description: 'Execution controller port; unset until it is scheduled' }),
    slicer_hostname: z.string().optional()
        .meta({ description: 'Execution controller host; unset until it is scheduled' }),
    teraslice_version: z.string()
        .meta({ description: 'Version that created the execution, prefixed with "v"' }),
}).meta({
    id: 'ExecutionRecord',
    description: `An execution: one run of a job, with the job config it ran with. ${jobConfigDocs}`,
});

/**
 * Loose for the same reason as `ExecutionRecordSchema`.
 *
 * Unlike an execution, a job is stored as submitted (`jobsService.submitJob`
 * and `updateJob` store the raw spec, not the validated config), so
 * defaults are never filled in: any config field the client left out is
 * absent. Only `operations` is required, because validation requires it.
 *
 * Response of `DELETE /jobs/:jobId`
 */
export const JobRecordSchema = z.looseObject({
    ...z.object(jobConfigShape).partial().shape,
    name: jobConfigShape.name.optional()
        .meta({
            description: 'Name of the job; defaults to "Custom Job"',
        }),
    operations: jobConfigShape.operations,
    ...recordShape,
    _context: z.literal('job'),
}).meta({
    id: 'JobRecord',
    description: 'A job config as it was submitted, before defaults are applied. '
        + 'The latest execution (`GET /jobs/{jobId}/ex`) has the resolved '
        + `config. ${jobConfigDocs}`,
});

/** ############# Search options ############# */

const sortOrders = ['asc', 'desc'];

/**
 * Whether `sort` is `field`, `field:asc` or `field:desc`, comma-separated for
 * more than one. Empty is allowed (the route uses the default). Checked
 * because OpenSearch silently ignores an entry whose order isn't `asc` or
 * `desc` (e.g. `_updated:sideways`) instead of rejecting it.
 */
function isValidSort(sort: string): boolean {
    if (sort === '') return true;

    return sort.split(',').every((entry) => {
        const [field, order, ...rest] = entry.split(':');
        if (!field.trim() || rest.length) return false;
        return order === undefined || sortOrders.includes(order);
    });
}

/**
 * Paging, sorting and filtering, shared by the list routes.
 */
const searchQueryShape = {
    size: z.coerce.number<number>().int()
        .min(0)
        .default(100)
        .meta({
            description: 'Maximum number of records to return. `from + size` is limited by '
                + 'the index\'s `max_result_window` (10,000 unless the cluster changes it)',
        }),
    from: z.coerce.number<number>().int()
        .min(0)
        .default(0)
        .meta({ description: 'Number of matching records to skip, for paging' }),
    sort: z.string()
        .refine(isValidSort, 'Expected field, field:asc or field:desc, comma-separated')
        .default('_updated:desc')
        .meta({
            description: 'Sort order as `field`, `field:asc` or `field:desc`, comma-separated '
                + 'for more than one; any other order is rejected. Empty uses the default',
        }),
    filter: z.string().optional()
        .meta({
            description: 'Lucene query string, ANDed with the route\'s own query, '
                + 'e.g. `name:"my-job"`',
        }),
};

const deletedQuery = z.stringbool().default(false)
    .meta({
        description: '`true` returns only soft-deleted records; `false` (the default) '
            + 'only records that aren\'t',
    });

/** Path params of every `/jobs/:jobId` route */
export const JobIdParams = z.strictObject({ jobId: z.string() });

/** Path params of every `/ex/:exId` route */
export const ExIdParams = z.strictObject({ exId: z.string() });

/** ################# /jobs ################## */

/** Response of `GET /jobs/:jobId` */
export const JobWithExecutionSchema = JobRecordSchema.extend({
    ex: ExecutionRecordSchema.partial().optional()
        .meta({
            description: 'The latest execution, limited to the fields named in `?ex`. '
                + 'Only set when `?ex` is sent; `{}` when the job has no execution, '
                + 'or its latest one is deleted.',
        }),
}).meta({ id: 'JobWithExecution' });

/** Query of `GET /jobs/:jobId` */
export const GetJobQuerySchema = z.strictObject({
    ex: z.string().optional()
        .meta({
            description: 'Comma-separated execution fields, e.g. `_status,ex_id`. Adds the '
                + 'latest execution as `ex`, with only these fields. Empty (`?ex=`) '
                + 'includes every field.',
        }),
});

export type GetJobQuery = z.input<typeof GetJobQuerySchema>;
export type JobWithExecution = z.output<typeof JobWithExecutionSchema>;

/** Query of `GET /jobs` */
export const GetJobsQuerySchema = z.strictObject({
    ...searchQueryShape,
    active: z.stringbool().optional()
        .meta({
            description: '`true` returns only active jobs, `false` only inactive ones; '
                + 'if left out it returns both',
        }),
    deleted: deletedQuery,
    ex: z.string().optional()
        .meta({
            description: 'Comma-separated execution fields, e.g. `_status,ex_id`. Adds each '
                + 'job\'s latest execution as `ex`, with only these fields. Empty (`?ex=`) '
                + 'includes every field.',
        }),
});

/** Response of `GET /jobs` */
export const JobWithExecutionListSchema = z.array(JobWithExecutionSchema)
    .meta({ description: 'Each job has `ex` only when `?ex` is sent' });

export type GetJobsQuery = z.input<typeof GetJobsQuerySchema>;
export type JobWithExecutionList = z.output<typeof JobWithExecutionListSchema>;

/** Response of `GET /jobs/:jobId/controller` */
export const JobControllerStatsSchema = ControllerStatsListSchema
    .meta({ description: 'Has one entry; 404 if the execution isn\'t running' });

/** ############## Slice errors ############## */

/**
 * A slice's state record, from the state storage index. The errors routes
 * only return slices in the `error` state.
 */
export const SliceStateRecordSchema = z.object({
    slice_id: z.string(),
    slicer_id: z.number().meta({ description: 'The slicer that created the slice' }),
    slicer_order: z.number()
        .meta({ description: 'Position of the slice in its slicer\'s sequence' }),
    request: z.string().meta({ description: 'The slice request, JSON encoded' }),
    state: z.enum(['pending', 'start', 'error', 'completed']),
    ex_id: z.string(),
    _created: Timestamp,
    _updated: Timestamp,
    error: z.string().optional()
        .meta({ description: 'The error with its stack trace; set when `state` is "error"' }),
    retry_count: z.number().optional()
        .meta({ description: 'Times the slice was retried; unset if it never was' }),
}).meta({ id: 'SliceStateRecord' });

/** Response of `GET /jobs/:jobId/errors` and `GET /ex/:exId/errors` */
export const SliceErrorListSchema = z.array(SliceStateRecordSchema);

/** Query of `GET /jobs/:jobId/errors` */
export const GetJobErrorsQuerySchema = z.strictObject(searchQueryShape);

export type GetJobErrorsQuery = z.input<typeof GetJobErrorsQuerySchema>;
export type SliceErrorList = z.output<typeof SliceErrorListSchema>;

/** ############### Slice tap ################ */

/** Query of `GET /jobs/:jobId/tap` */
export const GetJobTapQuerySchema = z.strictObject({
    size: z.union([
        z.literal('all'),
        // `0` means the whole slice, so an empty `?size=` must not coerce to it:
        // map `''` to NaN, which fails the number check. Typing `v` keeps the
        // client input type `number`, and toJSONSchema uses the inner schema.
        z.preprocess(
            (v: number) => ((v as unknown) === '' ? NaN : v),
            z.coerce.number<number>().int()
                .min(0)
        ),
    ], { error: 'Expected "all" or an integer >= 0' })
        .default(10)
        .meta({
            description: 'Number of records to capture; `0` or "all" captures the whole '
                + 'slice. Empty (`?size=`) is rejected.',
        }),
});

/** Response of `GET /jobs/:jobId/tap` */
export const SliceTapResultSchema = z.object({
    workerId: z.string().optional()
        .meta({ description: 'The worker that processed the tapped slice' }),
    sliceId: z.string(),
    records: z.array(z.array(z.object({
        record: z.record(z.string(), z.unknown()).meta({ description: 'The record\'s data' }),
        metadata: z.record(z.string(), z.unknown())
            .meta({ description: 'The record\'s DataEntity metadata, e.g. `_key`, `_createTime`' }),
    }))).meta({
        description: 'One entry per operation, in job order: `records[0]` is the reader, '
            + '`records[1]` the first processor, and so on. Each holds at most `size` records; '
            + 'an operation that returned none has an empty array.',
    }),
}).meta({
    id: 'SliceTapResult',
    description: 'Records from the next slice a worker processes',
});

export type GetJobTapQuery = z.input<typeof GetJobTapQuerySchema>;
export type SliceTapResult = z.output<typeof SliceTapResultSchema>;

/** ############## Job results ############### */

const deprecationReasonShape = {
    field: z.string().meta({ description: 'The deprecated field' }),
    description: z.string(),
};

export const JobWarningSchema = z.object({
    type: z.literal('JobValidation'),
    reason: z.discriminatedUnion('type', [
        z.object({
            type: z.literal('jobProperty'),
            kind: z.literal('deprecation'),
            reason: z.object(deprecationReasonShape),
        }),
        z.object({
            type: z.literal('assetOperation'),
            kind: z.literal('deprecation'),
            reason: z.object({
                _op: z.string().meta({ description: 'The operation the field is on' }),
                ...deprecationReasonShape,
            }),
        }),
        z.object({
            type: z.literal('assetAPIProperty'),
            kind: z.literal('deprecation'),
            reason: z.object({
                api_name: z.string().meta({ description: 'The api the field is on' }),
                ...deprecationReasonShape,
            }),
        }),
    ]),
}).meta({
    id: 'JobWarning',
    description: 'Something job validation flagged without rejecting the job, '
        + 'e.g. a deprecated field',
});

const jobWarnings = z.array(JobWarningSchema).optional()
    .meta({ description: 'Only set when validating the job produced warnings' });

/** Response of `POST /jobs/:jobId/_start` and `POST /jobs/:jobId/_recover` */
export const NewExecutionSchema = z.object({
    job_id: z.string(),
    ex_id: z.string().meta({ description: 'The execution that was created' }),
    warnings: jobWarnings,
}).meta({
    id: 'NewExecution',
    description: 'An execution that was created and queued to be scheduled',
});

export type NewExecution = z.output<typeof NewExecutionSchema>;

/**
 * Response of `PUT /jobs/:jobId`, `POST /jobs/:jobId/_active` and
 * `POST /jobs/:jobId/_inactive`
 */
export const UpdatedJobSchema = JobRecordSchema.extend({
    warnings: jobWarnings
        .meta({
            description: 'Only set when validating the job produced warnings. Making an '
                + 'active job inactive (`_inactive`, or a `PUT` with `active: false`) skips '
                + 'validation, so it never sets this.'
        }),
}).meta({ id: 'UpdatedJob', description: 'The job as stored after the update' });

export type UpdatedJob = z.output<typeof UpdatedJobSchema>;

/** ############### Job bodies ############### */

/**
 * Body of `POST /jobs` and `PUT /jobs/:jobId`. Only checks that there are
 * `operations`, each with an `_op`. `jobsService` validates the whole config
 * against the cluster's job schema, which depends on the cluster (connector
 * names, kubernetesV2-only fields) and coerces values (`"5"` for `workers`,
 * `"true"` for `active`), so typing every field here would reject jobs that
 * validation accepts. Loose because job validation only warns about
 * undeclared keys and op options depend on the asset.
 */
export const JobConfigBodySchema = z.looseObject({
    operations: z.array(
        z.looseObject({ _op: z.string().meta({ description: 'The operation name' }) })
    ),
}).meta({
    id: 'JobConfigBody',
    description: 'A job config. Validated against this cluster\'s job schema '
        + '(`GET /cluster/job-schema`) and stored as sent, without defaults.',
});

export type JobConfigBody = z.input<typeof JobConfigBodySchema>;

/** Query of `POST /jobs` */
export const SubmitJobQuerySchema = z.strictObject({
    start: z.stringbool().default(true)
        .meta({
            description: '`true` (the default) stores the job and starts it; `false` only '
                + 'stores it',
        }),
});

/** Response of `POST /jobs` */
export const SubmitJobResultSchema = z.object({
    job_id: z.string(),
    ex_id: z.string().optional()
        .meta({ description: 'The execution that was created; only set when `start` is `true`' }),
    warnings: jobWarnings,
}).meta({ id: 'SubmitJobResult' });

export type SubmitJobQuery = z.input<typeof SubmitJobQuerySchema>;
export type SubmitJobResult = z.output<typeof SubmitJobResultSchema>;

/** ############## Job actions ############### */

/** Query of `POST /jobs/:jobId/_stop` */
export const StopJobQuerySchema = z.strictObject({
    timeout: z.coerce.number<number>().int()
        .min(0)
        .optional()
        .meta({
            description: 'Milliseconds. native only. Accepted for parity with v1, but '
                + 'currently has no effect: processes stop within the cluster\'s '
                + '`shutdown_timeout`',
        }),
    blocking: z.stringbool().default(true)
        .meta({
            description: '`true` (the default) waits until the execution reaches a terminal '
                + 'status; `false` returns its status as soon as the stop is sent',
        }),
    force: z.stringbool().default(false)
        .meta({
            description: '`true` stops the execution even if it is already stopping or in a '
                + 'terminal status. On kubernetesV2 it also deletes every resource of the '
                + 'execution right away.',
        }),
});

/** Response of `POST /jobs/:jobId/_stop` */
export const StopJobResultSchema = z.object({
    status: ExecutionStatusSchema
        .meta({ description: 'The execution status when the request returned' }),
    message: z.string().optional()
        .meta({ description: 'Only set when `force` is `true`' }),
}).meta({ id: 'StopJobResult' });

export type StopJobQuery = z.input<typeof StopJobQuerySchema>;
export type StopJobResult = z.output<typeof StopJobResultSchema>;

/** Response of `POST /jobs/:jobId/_pause` */
export const PauseJobResultSchema = z.object({ status: z.literal('paused') })
    .meta({ id: 'PauseJobResult' });

/** Response of `POST /jobs/:jobId/_resume` */
export const ResumeJobResultSchema = z.object({ status: z.literal('running') })
    .meta({ id: 'ResumeJobResult' });

export type PauseJobResult = z.output<typeof PauseJobResultSchema>;
export type ResumeJobResult = z.output<typeof ResumeJobResultSchema>;

const workerCount = (min: number, description: string) => z.coerce.number<number>().int()
    .min(min)
    .optional()
    .meta({ description });

const workerKeys = ['add', 'remove', 'total'] as const;

const oneWorkerKey = 'Send exactly one of `add`, `remove` or `total`';

const totalZero = 'On kubernetesV2, `0` scales the workers down to none without stopping '
    + 'the execution; native rejects `0` unless the execution already has no workers.';

/**
 * Query of `POST /jobs/:jobId/_workers`. Exactly one key is allowed. The
 * refine keeps the schema a `ZodObject`, but JSON Schema can't express it,
 * so each field's description says so.
 */
export const ChangeJobWorkersQuerySchema = z.strictObject({
    add: workerCount(1, `Number of workers to add. ${oneWorkerKey}`),
    remove: workerCount(
        1,
        'Number of workers to remove. On kubernetesV2, removing every worker scales the '
        + 'workers down to none without stopping the execution; native rejects removing '
        + `as many as the execution has, or more. ${oneWorkerKey}`
    ),
    total: workerCount(0, `Number of workers to scale to. ${totalZero} ${oneWorkerKey}`),
}).refine(
    (query) => workerKeys.filter((key) => query[key] !== undefined).length === 1,
    { message: 'Send exactly one of add, remove or total' }
);

/** Response of `POST /jobs/:jobId/_workers` */
export const ChangeJobWorkersResultSchema = z.object({
    message: z.string().meta({ description: 'Human-readable summary of the change' }),
}).meta({ id: 'ChangeJobWorkersResult' });

export type ChangeJobWorkersQuery = z.input<typeof ChangeJobWorkersQuerySchema>;
export type ChangeJobWorkersResult = z.output<typeof ChangeJobWorkersResultSchema>;

/** Query of `POST /jobs/:jobId/_settings` */
export const UpdateJobSettingsQuerySchema = z.strictObject({
    log_level: LogLevelSchema
        .meta({ description: 'Log level for the running execution\'s processes' }),
});

/** Response of `POST /jobs/:jobId/_settings` */
export const UpdateJobSettingsResultSchema = z.object({
    exId: z.string(),
    level: LogLevelSchema,
}).meta({ id: 'UpdateJobSettingsResult' });

export type UpdateJobSettingsQuery = z.input<typeof UpdateJobSettingsQuerySchema>;
export type UpdateJobSettingsResult = z.output<typeof UpdateJobSettingsResultSchema>;

/** Query of `POST /jobs/:jobId/_recover` */
export const RecoverJobQuerySchema = z.strictObject({
    cleanup_type: z.enum(RecoveryCleanupType).optional()
        .meta({
            description: 'Reprocess only these slices, then finish instead of resuming: '
                + '`all`: slices left in error or started; `errors`: slices in error; '
                + '`pending`: slices not completed or failed. If left out, failed slices '
                + 'are retried and the execution resumes where it left off.',
        }),
    ex_id: z.string().optional()
        .meta({
            description: 'Execution to recover, with the config it ran with; must belong to '
                + 'the job. If left out, recovers the latest execution with the job\'s '
                + 'current config.',
        }),
});

export type RecoverJobQuery = z.input<typeof RecoverJobQuerySchema>;

/** ################## /ex ################### */

/** Query of `GET /ex` */
export const GetExecutionsQuerySchema = z.strictObject({
    ...searchQueryShape,
    status: z.string().optional()
        .meta({
            description: 'Comma-separated execution statuses, e.g. `running,failed`; '
                + 'returns executions in any status listed. Not validated: an unknown status '
                + 'matches nothing.',
        }),
    job_id: z.string().optional()
        .meta({ description: 'Only return executions of this job' }),
    deleted: deletedQuery,
});

/** Response of `GET /ex` */
export const ExecutionRecordListSchema = z.array(ExecutionRecordSchema);

/** Query of `GET /ex/:exId/errors` */
export const GetExecutionErrorsQuerySchema = z.strictObject(searchQueryShape);

export type GetExecutionsQuery = z.input<typeof GetExecutionsQuerySchema>;
export type ExecutionRecordList = z.output<typeof ExecutionRecordListSchema>;
export type GetExecutionErrorsQuery = z.input<typeof GetExecutionErrorsQuerySchema>;
