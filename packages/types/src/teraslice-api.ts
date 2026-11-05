import { z } from 'zod';
import { ProcessAssignment } from './teraslice.js';

/**
 * HTTP methods supported by /v2 routes. Lowercase so they can be used
 * directly as express router methods and as OpenAPI path item keys.
 */
export type RouteMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

/** Groups /v2 routes in the OpenAPI spec (`tags` field). */
export type RouteTag = 'Cluster' | 'Jobs' | 'Executions';

/**
 * Schema for path params or query params. Must be an object schema so the
 * OpenAPI generator can emit one `parameters[]` entry per property, and must
 * be a `z.strictObject` so unknown keys are rejected. The type can't enforce
 * strictness (zod's `$strict` and `$strip` configs are identical types);
 * teraslice checks it when the route is registered.
 */
export type ParamsSchema = z.ZodObject<z.ZodRawShape, z.core.$ZodObjectConfig>;

/**
 * A single /v2 route definition. Shared by the teraslice server
 * (validation, handler typing, OpenAPI generation) and its clients.
 *
 * @template P - path params schema
 * @template Q - query params schema
 * @template B - request body schema
 * @template R - response body schema
 */
export interface RouteDef<
    P extends ParamsSchema | undefined = undefined,
    Q extends ParamsSchema | undefined = undefined,
    B extends z.ZodType | undefined = undefined,
    R extends z.ZodType = z.ZodType
> {
    /**
     * Unique id for the route, used as the OpenAPI `operationId` (and by
     * generated clients as a method name). By convention, the name the def
     * is exported as, e.g. `getClusterConnectors`.
     */
    operationId: string;
    method: RouteMethod;
    /** Express-style path, relative to /v2, e.g. `/jobs/:jobId` */
    path: string;
    /** Short description, used as the OpenAPI operation summary */
    summary: string;
    /** Groups the route in the OpenAPI spec */
    tags?: readonly RouteTag[];
    params?: P;
    query?: Q;
    body?: B;
    response: R;
}

/**
 * Define a /v2 route. An identity function at runtime; its job is to
 * capture the exact schema types so handlers and clients can infer
 * request and response shapes from the definition.
 *
 * Schemas left out of the definition are typed as `undefined`.
 *
 * @example
 * export const getJob = defineRoute({
 *     operationId: 'getJob',
 *     method: 'get',
 *     path: '/jobs/:jobId',
 *     summary: 'Get a job',
 *     tags: ['Jobs'],
 *     params: z.strictObject({ jobId: z.string() }),
 *     response: JobSchema,
 * });
 */
export function defineRoute<
    P extends ParamsSchema | undefined = undefined,
    Q extends ParamsSchema | undefined = undefined,
    B extends z.ZodType | undefined = undefined,
    R extends z.ZodType = z.ZodType
>(def: RouteDef<P, Q, B, R>): RouteDef<P, Q, B, R> {
    return def;
}

/** Generic route type that all routes will fit into */
export type AnyRouteDef = RouteDef<
    ParamsSchema | undefined,
    ParamsSchema | undefined,
    z.ZodType | undefined,
    z.ZodType
>;

type SchemaInput<S> = S extends z.ZodType ? z.input<S> : undefined;
type SchemaOutput<S> = S extends z.ZodType ? z.output<S> : undefined;

/**
 * Path params a client sends for a route (`undefined` if the route has none).
 * @example type Params = RouteParams<typeof getJob>; // { jobId: string }
 */
export type RouteParams<D extends AnyRouteDef>
    = D extends RouteDef<infer P, any, any, any> ? SchemaInput<P> : never;

/** Query params a client sends for a route (`undefined` if the route has none). */
export type RouteQuery<D extends AnyRouteDef>
    = D extends RouteDef<any, infer Q, any, any> ? SchemaInput<Q> : never;

/** Request body a client sends for a route (`undefined` if the route has none). */
export type RouteBody<D extends AnyRouteDef>
    = D extends RouteDef<any, any, infer B, any> ? SchemaInput<B> : never;

/** Response body a client receives from a route. */
export type RouteResponse<D extends AnyRouteDef>
    = D extends RouteDef<any, any, any, infer R> ? SchemaOutput<R> : never;

/** ############ V2 ROUTE SCHEMAS ############ */

/** ################### / ################### */

export const ClusterInfoSchema = z.object({
    arch: z.string(),
    clustering_type: z.enum(['native', 'kubernetesV2']),
    name: z.string().meta({ description: 'The cluster name' }),
    node_version: z.string(),
    platform: z.string(),
    teraslice_version: z.string().meta({ description: 'Prefixed with "v", e.g. "v3.1.0"' }),
}).meta({ id: 'ClusterInfo' });

export const getClusterInfoDef = defineRoute({
    operationId: 'getClusterInfo',
    method: 'get',
    path: '/',
    summary: 'Get cluster and version information',
    tags: ['Cluster'],
    response: ClusterInfoSchema,
});

/** ################ /cluster ################ */

/** ################# /state ################# */

export const ProcessNodeSchema = z.object({
    worker_id: z.union([z.string(), z.number()]),
    assignment: z.enum(ProcessAssignment),
    pid: z.number().optional(),
    ex_id: z.string().optional()
        .meta({ description: 'Set on execution_controller and worker processes' }),
    job_id: z.string().optional()
        .meta({ description: 'Set on execution_controller and worker processes' }),
    assets: z.array(z.string()).optional(),
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

export const NodeStateSchema = z.object({
    node_id: z.string(),
    hostname: z.string(),
    pid: z.union([z.number(), NotAvailable]),
    node_version: z.string(),
    teraslice_version: z.string(),
    total: z.union([z.number(), NotAvailable])
        .meta({ description: 'Worker capacity of the node' }),
    state: z.string().meta({ description: 'e.g. "connected" or "disconnected"' }),
    available: z.union([z.number(), NotAvailable])
        .meta({ description: 'Free worker slots on the node' }),
    active: z.array(ProcessNodeSchema),
}).meta({ id: 'NodeState' });

export const ClusterStateSchema = z.record(z.string(), NodeStateSchema).meta({
    id: 'ClusterState',
    description: 'Node state keyed by node id',
});

export const getClusterStateDef = defineRoute({
    operationId: 'getClusterState',
    method: 'get',
    path: '/cluster/state',
    summary: 'Get the state of every node in the cluster',
    tags: ['Cluster'],
    response: ClusterStateSchema,
});

/** ################# /stats ################# */

export const AggregatedExecutionAnalyticsSchema = z.object({
    processed: z.number(),
    failed: z.number(),
    queued: z.number(),
    job_duration: z.number(),
    workers_joined: z.number(),
    workers_reconnected: z.number(),
    workers_disconnected: z.number(),
}).meta({ id: 'AggregatedExecutionAnalytics' });

export const ClusterStatsSchema = z.object({
    controllers: AggregatedExecutionAnalyticsSchema
        .meta({ description: 'Totals across every execution controller' }),
}).meta({ id: 'ClusterStats' });

export const getClusterStatsDef = defineRoute({
    operationId: 'getClusterStats',
    method: 'get',
    path: '/cluster/stats',
    summary: 'Get slice and worker stats across all executions',
    tags: ['Cluster'],
    response: ClusterStatsSchema,
});

/** ############## /controllers ############## */

export const ControllerStatsSchema = AggregatedExecutionAnalyticsSchema.extend({
    ex_id: z.string(),
    job_id: z.string(),
    name: z.string().meta({ description: 'The job name' }),
    workers_available: z.number(),
    workers_active: z.number(),
    subslices: z.number(),
    slice_range_expansion: z.number(),
    slicers: z.number(),
    subslice_by_key: z.number(),
    started: z.string().optional()
        .meta({ description: 'ISO 8601 timestamp, unset until the execution starts' }),
    queuing_complete: z.string().optional()
        .meta({ description: 'ISO 8601 timestamp, unset until all slices are queued' }),
}).meta({
    id: 'ControllerStats',
    description: 'Live statistics from a running execution controller',
});

export const getClusterControllersDef = defineRoute({
    operationId: 'getClusterControllers',
    method: 'get',
    path: '/cluster/controllers',
    summary: 'Get statistics for every running execution controller',
    tags: ['Cluster'],
    response: z.array(ControllerStatsSchema),
});

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
    $id: z.string(),
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

export const getClusterJobSchemaDef = defineRoute({
    operationId: 'getClusterJobSchema',
    method: 'get',
    path: '/cluster/job-schema',
    summary: 'Get the JSON Schema for job configs on this cluster',
    tags: ['Cluster'],
    response: JobSchemaResponseSchema,
});

/** ############### /connectors ############## */

export const ConnectorInfoSchema = z.object({
    type: z.string(),
    name: z.string(),
    is_state_cluster: z.boolean().optional(),
    is_asset_store: z.boolean().optional(),
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

export const getClusterConnectorsDef = defineRoute({
    operationId: 'getClusterConnectors',
    method: 'get',
    path: '/cluster/connectors',
    summary: 'List the configured connectors',
    tags: ['Cluster'],
    query: z.strictObject({
        type: z.string().optional()
            .meta({ description: 'Only return connectors of this type' }),
        name: z.string().optional()
            .meta({ description: 'Only return connections with this name' }),
        groupBy: z.enum(['type']).optional()
            .meta({
                description: 'Return connection names grouped by connector type'
            }),
    }),
    response: ConnectorListResponseSchema,
});

/**              JOBS              */

/**           EXECUTIONS           */
