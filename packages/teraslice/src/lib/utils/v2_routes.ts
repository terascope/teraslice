import { Router } from 'express';
import { z } from 'zod';
import { TSError, isEmpty, isPlainObject } from '@terascope/core-utils';
import type { TerasliceRequest, TerasliceResponse } from '../../interfaces.js';
import { handleTerasliceRequest } from './api_utils.js';

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
 * `register` checks it when the route is registered.
 */
export type ParamsSchema = z.ZodObject<z.ZodRawShape, z.core.$ZodObjectConfig>;

/** Parsed (output) type of a schema, or `undefined` when the route omits it */
type Parsed<S> = S extends z.ZodType ? z.output<S> : undefined;

/** The validated request a v2 handler receives */
export interface RouteInput<P, Q, B> {
    params: Parsed<P>;
    query: Parsed<Q>;
    body: Parsed<B>;
}

/**
 * What a handler returns: the response schema's output, or, on a `raw`
 * route, a Buffer that already holds the serialized JSON response.
 */
export type RouteResult<R extends z.ZodType, X extends boolean>
    = X extends true ? Buffer : z.output<R>;

/**
 * A v2 route handler. Receives the parsed params/query/body (coercion and
 * defaults applied) and returns the response body, typed as the response
 * schema's output (a Buffer on a `raw` route).
 */
export type RouteHandler<
    P extends ParamsSchema | undefined,
    Q extends ParamsSchema | undefined,
    B extends z.ZodType | undefined,
    R extends z.ZodType,
    X extends boolean = false
> = (
    input: RouteInput<P, Q, B>,
    req: TerasliceRequest,
    res: TerasliceResponse
) => RouteResult<R, X> | Promise<RouteResult<R, X>>;

/**
 * A route's path params as express passes them, before validation: the
 * params schema's input type, or no keys for a route without params.
 */
export type RawParams<P> = P extends z.ZodType ? z.input<P> : Record<never, never>;

export interface RegisterOptions<P extends ParamsSchema | undefined = undefined> {
    /**
     * Message used when the handler throws an error without a message field.
     * A function is called per request with the raw path params, e.g.
     * ``({ jobId }) => `Could not start job: ${jobId}` ``. It runs before the
     * params are validated (the default must exist before anything can
     * throw), so it gets the raw strings; a request that fails validation gets
     * the validation message instead, never this one.
     */
    errorMessage?: string | ((params: RawParams<P>) => string);
}

/**
 * Everything about a /v2 route except its method and path: the spec object
 * the method helpers take (`registry.get(path, spec, handler)`), so a route
 * reads like a plain express route. `RouteDef` adds `method` and `path`.
 */
export interface RouteSpec<
    P extends ParamsSchema | undefined = undefined,
    Q extends ParamsSchema | undefined = undefined,
    B extends z.ZodType | undefined = undefined,
    R extends z.ZodType = z.ZodType,
    X extends boolean = false
> {
    /**
     * Unique id for the route, used as the OpenAPI `operationId` (and by
     * generated clients as a method name), e.g. `getClusterConnectors`.
     */
    operationId: string;
    /** Short description, used as the OpenAPI operation summary */
    summary: string;
    /** Groups the route in the OpenAPI spec */
    tags?: readonly RouteTag[];
    params?: P;
    query?: Q;
    body?: B;
    response: R;
    /**
     * The handler returns a Buffer of already-serialized JSON, which is sent
     * as-is with a JSON content type instead of being re-serialized. For
     * pass-through responses (the slice tap) where parsing just to
     * re-serialize would cost a copy of every record. `response` still
     * describes the JSON for clients and the spec, but the handler's return
     * is no longer type checked against it.
     */
    raw?: X;
}

/**
 * A full /v2 route definition: a `RouteSpec` plus its method and path. What
 * the registry records in `routes` and what the OpenAPI generator reads.
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
    R extends z.ZodType = z.ZodType,
    X extends boolean = false
> extends RouteSpec<P, Q, B, R, X> {
    method: RouteMethod;
    /** Express-style path, relative to /v2, e.g. `/jobs/:jobId` */
    path: string;
}

/** Generic route type that all routes will fit into */
export type AnyRouteDef = RouteDef<
    ParamsSchema | undefined,
    ParamsSchema | undefined,
    z.ZodType | undefined,
    z.ZodType,
    boolean
>;

/** Registers a route for one HTTP method; see `RouteRegistry.register` */
export type MethodRegister = <
    P extends ParamsSchema | undefined = undefined,
    Q extends ParamsSchema | undefined = undefined,
    B extends z.ZodType | undefined = undefined,
    R extends z.ZodType = z.ZodType,
    X extends boolean = false
>(
    path: string,
    spec: RouteSpec<P, Q, B, R, X>,
    handler: RouteHandler<P, Q, B, R, X>,
    options?: RegisterOptions<P>
) => void;

export interface RouteRegistry {
    /** The express router the routes are mounted on */
    readonly router: Router;
    /** Route defs registered so far, in registration order */
    readonly routes: readonly AnyRouteDef[];
    /**
     * Register a route.
     *
     * Throws at registration (so a mistake fails ApiService startup) if:
     * - `params` or `query` isn't a `z.strictObject`
     * - the `params` keys don't match the path's `:params`
     * - the method + path, or the operationId, is already registered
     *
     * On each request, validates against the def's schemas and responds with
     * a 400 in the standard `sendError` shape if:
     * - params, query or body fail their schema
     * - the def has no `query` schema and any query param is sent
     * - the def has no `body` schema and a non-empty body is sent
     *
     * On a `raw` route, a handler result that isn't a Buffer is a 500.
     */
    register<
        P extends ParamsSchema | undefined,
        Q extends ParamsSchema | undefined,
        B extends z.ZodType | undefined,
        R extends z.ZodType,
        X extends boolean = false
    >(
        def: RouteDef<P, Q, B, R, X>,
        handler: RouteHandler<P, Q, B, R, X>,
        options?: RegisterOptions<P>
    ): void;
    /**
     * Register a route with the method and path in the call, e.g.
     * `registry.get('/jobs/:jobId', { operationId, summary, params, ... }, handler)`.
     * Same checks and validation as `register`.
     */
    get: MethodRegister;
    post: MethodRegister;
    put: MethodRegister;
    patch: MethodRegister;
    delete: MethodRegister;
}

/** Checked against the query of a route that declares no query schema */
const noQuerySchema = z.strictObject({});

/** The prefix of registration errors, e.g. `v2 route GET /jobs/:jobId` */
function routeLabel(def: AnyRouteDef): string {
    return `v2 route ${def.method.toUpperCase()} ${def.path}`;
}

/** Parse a value against the schema or throw an error
 * This is where defaults are set and types are coerced.
 */
function parsePart(
    part: 'params' | 'query' | 'body',
    schema: z.ZodType,
    value: unknown
): unknown {
    const result = schema.safeParse(value);
    if (!result.success) {
        throw new TSError(`Invalid request ${part}:\n${z.prettifyError(result.error)}`, {
            statusCode: 400
        });
    }
    return result.data;
}

/**
 * Validates the path params of a route, or returns `undefined` if the route
 * has no params schema. Skipping validation is safe because a route only
 * lacks a params schema when its path has no `:params`; any other route
 * was rejected at registration by `assertParamsMatchPath`.
 */
function parseParams(schema: ParamsSchema | undefined, value: unknown): unknown {
    return schema ? parsePart('params', schema, value) : undefined;
}

/**
 * Validates the query of a route. A route without a query schema accepts no
 * query params, so unknown keys get the same 400 as on a route with one.
 * The handler still gets `undefined` for it.
 */
function parseQuery(schema: ParamsSchema | undefined, value: unknown): unknown {
    if (schema) return parsePart('query', schema, value);

    parsePart('query', noQuerySchema, value); // rejects any key
    return undefined;
}

/**
 * Validates the body of a route. A route without a body schema accepts no
 * body: `undefined` (nothing parsed) or `{}` (an empty JSON object, which
 * some clients send by default) pass, anything else gets a 400.
 */
function parseBody(schema: z.ZodType | undefined, value: unknown): unknown {
    if (schema) return parsePart('body', schema, value);

    const isEmptyBody = value === undefined || (isPlainObject(value) && isEmpty(value));
    if (!isEmptyBody) {
        throw new TSError('Invalid request body:\nThis route does not accept a request body', {
            statusCode: 400
        });
    }
    return undefined;
}

/**
 * Whether a schema rejects unknown keys, i.e. was made with `z.strictObject`
 * or `.strict()`. Checked at runtime because zod's `$strict` and `$strip`
 * object configs are structurally identical types, so TypeScript can't tell
 * them apart.
 */
function isStrictObject(schema: z.ZodType): boolean {
    return schema._zod.def.type === 'object'
        && (schema as z.ZodObject)._zod.def.catchall?._zod.def.type === 'never';
}

/**
 * Throws if the def's params or query schema would silently drop unknown
 * keys. We want unknown keys (typos) to throw an error instead of being
 * silently ignored. Runs at registration, so a mistake fails ApiService
 * startup rather than a request.
 */
function assertStrictParts(def: AnyRouteDef): void {
    for (const part of ['params', 'query'] as const) {
        const schema = def[part];
        if (schema && !isStrictObject(schema)) {
            throw new Error(`${routeLabel(def)}: ${part} must be a z.strictObject`);
        }
    }
}

/**
 * Names of the params in an express path, e.g. `/jobs/:jobId` → `['jobId']`.
 * Covers named params (`:name`) and named wildcards (`*name`).
 */
function pathParamNames(path: string): string[] {
    return Array.from(path.matchAll(/[:*]([A-Za-z_$][\w$]*)/g), (match) => match[1]);
}

/**
 * Throws if the def's params schema doesn't have exactly the path's params as
 * keys. With strict params, a mismatch would otherwise 400 every request:
 * a path param missing from the schema is an unrecognized key, and a schema
 * key missing from the path is never sent.
 */
function assertParamsMatchPath(def: AnyRouteDef): void {
    const pathNames = pathParamNames(def.path);
    const schemaKeys = def.params ? Object.keys(def.params.shape) : [];

    const missing = pathNames.filter((name) => !schemaKeys.includes(name));
    const extra = schemaKeys.filter((key) => !pathNames.includes(key));
    if (!missing.length && !extra.length) return;

    const problems = [
        missing.length && `missing from params schema: ${missing.join(', ')}`,
        extra.length && `not in path: ${extra.join(', ')}`,
    ].filter(Boolean);

    throw new Error(
        `${routeLabel(def)}: params schema must match path params (${problems.join('; ')})`
    );
}

/**
 * Throws if a route with the same method and path, or the same operationId,
 * is already registered. Express would silently send every request to the
 * first handler, and the OpenAPI spec needs unique operationIds.
 */
function assertUnique(def: AnyRouteDef, routes: readonly AnyRouteDef[]): void {
    if (routes.some((r) => r.method === def.method && r.path === def.path)) {
        throw new Error(`${routeLabel(def)}: already registered`);
    }

    const sameId = routes.find((r) => r.operationId === def.operationId);
    if (sameId) {
        throw new Error(
            `${routeLabel(def)}: operationId "${def.operationId}" is already used by ${routeLabel(sameId)}`
        );
    }
}

/**
 * Create a router plus the list of route defs registered on it. The list
 * feeds the OpenAPI generator; each registry has its own, so separate
 * ApiService instances never share routes.
 */
export function createRouteRegistry(router: Router = Router()): RouteRegistry {
    const routes: AnyRouteDef[] = [];

    const register: RouteRegistry['register'] = (def, handler, { errorMessage } = {}) => {
        assertStrictParts(def);
        assertParamsMatchPath(def);
        assertUnique(def, routes);

        router[def.method](def.path, (req: TerasliceRequest, res: TerasliceResponse) => {
            const defaultErrorMsg = typeof errorMessage === 'function'
                ? errorMessage(req.params as Parameters<typeof errorMessage>[0])
                : errorMessage;
            const requestHandler = handleTerasliceRequest(req, res, defaultErrorMsg);
            requestHandler(async () => {
                const input = {
                    params: parseParams(def.params, req.params),
                    query: parseQuery(def.query, req.query),
                    body: parseBody(def.body, req.body),
                } as Parameters<typeof handler>[0];

                if (!def.raw) return handler(input, req, res);

                const result = await handler(input, req, res);
                if (!Buffer.isBuffer(result)) {
                    throw new TSError(`${routeLabel(def)}: raw handler must return a Buffer`);
                }
                // handleTerasliceRequest sends a Buffer as-is; mark it as JSON
                res.type('json');
                return result;
            });
        });

        routes.push(def);
    };

    function forMethod(method: RouteMethod): MethodRegister {
        return (path, spec, handler, options) => register(
            { ...spec, method, path }, handler, options
        );
    }

    return {
        router,
        routes,
        register,
        get: forMethod('get'),
        post: forMethod('post'),
        put: forMethod('put'),
        patch: forMethod('patch'),
        delete: forMethod('delete'),
    };
}
