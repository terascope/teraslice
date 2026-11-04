import { z } from 'zod';

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

/** ################ /cluster ################ */

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
