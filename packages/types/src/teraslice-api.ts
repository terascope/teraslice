import { z } from 'zod';
import {
    DataEncoding, ExecutionStatusEnum, ProcessAssignment, RecoveryCleanupType,
    type ExecutionStatus
} from './teraslice.js';

/** ############ V2 ROUTE SCHEMAS ############ */

/** ################### / ################### */

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

/** ############### /job-schema ############## */

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

export const JobSchemaResponseSchema = z.object({
    version: z.string().meta({ description: 'Teraslice version, without a "v" prefix' }),
    job_schema: JobJSONSchemaSchema,
}).meta({ id: 'JobSchemaResponse' });

/** ############### /connectors ############## */

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

/** ########## Job and execution records ######### */

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
 * absent. Only `name` and `operations` are required, because validation
 * requires them.
 */
export const JobRecordSchema = z.looseObject({
    ...z.object(jobConfigShape).partial().shape,
    name: jobConfigShape.name,
    operations: jobConfigShape.operations,
    ...recordShape,
    _context: z.literal('job'),
}).meta({
    id: 'JobRecord',
    description: 'A job config as it was submitted: fields left out are absent, not '
        + 'defaulted. The latest execution (`GET /jobs/{jobId}/ex`) has the resolved '
        + `config. ${jobConfigDocs}`,
});

/** Path params of every /jobs/:jobId route */
export const JobIdParams = z.strictObject({ jobId: z.string() });

/** Path params of every /ex/:exId route */
export const ExIdParams = z.strictObject({ exId: z.string() });

/** ################# /jobs ################## */

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

/** Response of `GET /jobs/:jobId/controller` */
export const JobControllerStatsSchema = ControllerStatsListSchema
    .meta({ description: 'Has one entry; 404 if the execution isn\'t running' });
