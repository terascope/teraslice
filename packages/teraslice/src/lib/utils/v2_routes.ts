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
export type RouteTag = 'Cluster' | 'Jobs' | 'Executions' | 'Assets' | 'Text';

/**
 * Schema for path params or query params. Must be an object schema so the
 * OpenAPI generator can emit one `parameters[]` entry per property, and must
 * be a `z.strictObject` so unknown keys are rejected. The type can't enforce
 * strictness (zod's `$strict` and `$strip` configs are identical types);
 * `register` checks it when the route is registered.
 */
export type ParamsSchema = z.ZodObject<z.ZodRawShape, z.core.$ZodObjectConfig>;

/** Parsed (output) type of a schema, or `undefined` when the route omits it */
export type Parsed<S> = S extends z.ZodType ? z.output<S> : undefined;

/** The validated request a v2 handler receives */
export interface RouteInput<P, Q, B> {
    params: Parsed<P>;
    query: Parsed<Q>;
    body: Parsed<B>;
}

/**
 * How a route sends its response, set by `format` on the route spec:
 * - `json` (the default): the handler returns the response object, which is
 *   sent as JSON.
 * - `raw`: the handler returns a Buffer that already holds the serialized
 *   JSON, which is sent as-is with a JSON content type. For pass-through
 *   responses (the slice tap) where parsing just to re-serialize would cost a
 *   copy of every record. `response` still describes the JSON for clients and
 *   the spec, but the handler's return is no longer type checked against it.
 * - `text`: the handler returns a `TextResult`, whose body is sent as
 *   `text/plain` with its headers set. `response` must be a string schema.
 */
export type ResponseFormat = 'json' | 'raw' | 'text';

/** What the handler of a `text` route returns */
export interface TextResult {
    body: string;
    /** Response headers to set; each must be declared in `responseHeaders` */
    headers?: Record<string, string>;
}

/**
 * How a route takes its request body, set by `bodyFormat` on the route spec:
 * - `json` (the default): the body, already parsed by `bodyParser`, is
 *   validated against `body`, or must be empty when there's no `body` schema.
 * - `binary`: the body isn't parsed or validated. The handler reads `req` as
 *   a stream, e.g. an uploaded zip. The route can't have a `body` schema; the
 *   spec documents the body as `application/octet-stream`.
 */
export type BodyFormat = 'json' | 'binary';

/**
 * A `json` handler's response with a success status other than 200, made by
 * `withStatus`. The status must be listed in the route's `successStatuses`.
 */
export class StatusResult<T> {
    /**
     * `value`, not `body`: a `{ status, body: string }` would type check as a
     * `TextResult`, letting a `text` handler return one.
     */
    constructor(readonly status: number, readonly value: T) {}
}

/**
 * Responds with `status` instead of 200, e.g. `withStatus(201, created)`.
 * Only for `json` routes, and `status` must be in the route's
 * `successStatuses`.
 */
export function withStatus<T>(status: number, value: T): StatusResult<T> {
    return new StatusResult(status, value);
}

/**
 * What a handler returns for each `ResponseFormat`. A `json` handler can
 * also wrap its result with `withStatus` to send a status other than 200.
 */
export type RouteResult<R extends z.ZodType, F extends ResponseFormat>
    = F extends 'raw' ? Buffer
        : F extends 'text' ? TextResult
            : z.output<R> | StatusResult<z.output<R>>;

/**
 * A v2 route handler. Receives the parsed params/query/body (coercion and
 * defaults applied) and returns the response body: the response schema's
 * output, a Buffer on a `raw` route, or a `TextResult` on a `text` route.
 */
export type RouteHandler<
    P extends ParamsSchema | undefined,
    Q extends ParamsSchema | undefined,
    B extends z.ZodType | undefined,
    R extends z.ZodType,
    F extends ResponseFormat = 'json'
> = (
    input: RouteInput<P, Q, B>,
    req: TerasliceRequest,
    res: TerasliceResponse
) => RouteResult<R, F> | Promise<RouteResult<R, F>>;

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
    F extends ResponseFormat = 'json'
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
    /** How the request body is read; see `BodyFormat`. Defaults to `json` */
    bodyFormat?: BodyFormat;
    response: R;
    /** How the response is sent; see `ResponseFormat`. Defaults to `json` */
    format?: F;
    /**
     * Success statuses of a `json` route, with a description of each for the
     * OpenAPI spec, e.g. `{ 200: 'Already existed', 201: 'Created' }`. A
     * handler sends one other than 200 by returning `withStatus(status, body)`.
     * 200 is always documented, as "Success" unless listed here. Each must be
     * a 2xx status. Only allowed on `json` routes.
     */
    successStatuses?: Record<number, string>;
    /**
     * Headers a `text` route may send, with a description of each for the
     * OpenAPI spec, e.g. `{ 'X-Total-Count': 'Number of matching records' }`.
     * Only allowed on `text` routes.
     */
    responseHeaders?: Record<string, string>;
}

/**
 * A full /v2 route definition: a `RouteSpec` plus its method and path. What
 * the registry records in `routes` and what the OpenAPI generator reads.
 *
 * @template P - path params schema
 * @template Q - query params schema
 * @template B - request body schema
 * @template R - response body schema
 * @template F - response format
 */
export interface RouteDef<
    P extends ParamsSchema | undefined = undefined,
    Q extends ParamsSchema | undefined = undefined,
    B extends z.ZodType | undefined = undefined,
    R extends z.ZodType = z.ZodType,
    F extends ResponseFormat = 'json'
> extends RouteSpec<P, Q, B, R, F> {
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
    ResponseFormat
>;

/** Registers a route for one HTTP method; see `RouteRegistry.register` */
export type MethodRegister = <
    P extends ParamsSchema | undefined = undefined,
    Q extends ParamsSchema | undefined = undefined,
    B extends z.ZodType | undefined = undefined,
    R extends z.ZodType = z.ZodType,
    F extends ResponseFormat = 'json'
>(
    path: string,
    spec: RouteSpec<P, Q, B, R, F>,
    handler: RouteHandler<P, Q, B, R, F>,
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
     * - a `text` route's `response` isn't a string schema, or a route that
     *   isn't `text` sets `responseHeaders`
     * - a route that isn't `json` sets `successStatuses`
     * - `successStatuses` contains a status outside the 2xx range
     * - a `binary` body route has a `body` schema, or its method is `get` or
     *   `delete`
     *
     * On each request, validates against the def's schemas and responds with
     * a 400 in the standard `sendError` shape if:
     * - params, query or body fail their schema
     * - the def has no `query` schema and any query param is sent
     * - the def has no `body` schema and a non-empty body is sent (unless
     *   its `bodyFormat` is `binary`)
     *
     * Responds with a 500 if the handler returns:
     * - on a `raw` route, anything but a Buffer
     * - on a `text` route, a result without a string body, or with a header
     *   that isn't in `responseHeaders`
     * - on a `json` route, a `withStatus` result whose status isn't in
     *   `successStatuses`
     */
    register<
        P extends ParamsSchema | undefined,
        Q extends ParamsSchema | undefined,
        B extends z.ZodType | undefined,
        R extends z.ZodType,
        F extends ResponseFormat = 'json'
    >(
        def: RouteDef<P, Q, B, R, F>,
        handler: RouteHandler<P, Q, B, R, F>,
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
 * Throws if:
 * - a route that isn't `json` declares `successStatuses` (only a `json`
 *   handler can return `withStatus`), or one of them isn't 2xx
 * - a `text` route's `response` isn't a string schema (it describes the body
 *   in the spec)
 * - a route that isn't `text` declares `responseHeaders` (only a `text`
 *   handler can send headers)
 */
function assertFormat(def: AnyRouteDef): void {
    if (def.successStatuses) {
        if (def.format && def.format !== 'json') {
            throw new Error(`${routeLabel(def)}: only a json route can have successStatuses`);
        }
        const invalid = Object.keys(def.successStatuses)
            .filter((status) => !/^2\d\d$/.test(status));
        if (invalid.length) {
            throw new Error(
                `${routeLabel(def)}: successStatuses must be 2xx, got ${invalid.join(', ')}`
            );
        }
    }

    if (def.format === 'text') {
        if (def.response._zod.def.type !== 'string') {
            throw new Error(`${routeLabel(def)}: a text route's response must be a string schema`);
        }
        return;
    }

    if (def.responseHeaders) {
        throw new Error(`${routeLabel(def)}: only a text route can have responseHeaders`);
    }
}

/**
 * Throws if a `binary` body route also has a `body` schema (its body is
 * never parsed, so the schema would never run), or is a `get` or `delete`,
 * which don't take a body.
 */
function assertBodyFormat(def: AnyRouteDef): void {
    if (def.bodyFormat !== 'binary') return;

    if (def.body) {
        throw new Error(`${routeLabel(def)}: a binary body route can't have a body schema`);
    }
    if (def.method === 'get' || def.method === 'delete') {
        throw new Error(`${routeLabel(def)}: a ${def.method} route can't take a binary body`);
    }
}

/**
 * Sets the status of a `withStatus` result and returns its body. Any other
 * result is returned as-is, and sent with a 200.
 */
function unwrapStatus(def: AnyRouteDef, result: unknown, res: TerasliceResponse): unknown {
    if (!(result instanceof StatusResult)) return result;

    if (!Object.hasOwn(def.successStatuses ?? {}, result.status)) {
        throw new TSError(
            `${routeLabel(def)}: status ${result.status} is not in successStatuses`
        );
    }
    res.status(result.status);
    return result.value;
}

/**
 * Checks a `text` handler's result and returns its body, after setting its
 * headers and the `text/plain` content type.
 */
function sendText(def: AnyRouteDef, result: unknown, res: TerasliceResponse): string {
    if (!isPlainObject(result) || typeof (result as TextResult).body !== 'string') {
        throw new TSError(`${routeLabel(def)}: text handler must return { body: string }`);
    }

    const { body, headers = {} } = result as TextResult;
    const declared = Object.keys(def.responseHeaders ?? {});
    const undeclared = Object.keys(headers).filter((name) => !declared.includes(name));
    if (undeclared.length) {
        throw new TSError(
            `${routeLabel(def)}: headers not in responseHeaders: ${undeclared.join(', ')}`
        );
    }

    res.set(headers);
    res.type('text/plain');
    return body;
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
        assertFormat(def);
        assertBodyFormat(def);
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
                    // a binary body is left on `req` for the handler to stream
                    body: def.bodyFormat === 'binary' ? undefined : parseBody(def.body, req.body),
                } as Parameters<typeof handler>[0];

                const result = await handler(input, req, res);

                if (def.format === 'text') return sendText(def, result, res);
                if (def.format !== 'raw') return unwrapStatus(def, result, res);

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
