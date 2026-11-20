import 'jest-extended';
import http from 'node:http';
import express from 'express';
import bodyParser from 'body-parser';
import got from 'got';
import { z } from 'zod';
import { debugLogger, TSError } from '@terascope/core-utils';
import { TestContext } from '@terascope/job-components';
import { findPort } from '../../src/lib/utils/port_utils.js';
import {
    createRouteRegistry, withStatus, type ParamsSchema, type ResponseFormat,
    type RouteDef, type TextResult
} from '../../src/lib/utils/v2_routes.js';
import { generateV2Spec } from '../../src/lib/cluster/services/api/v2/openapi.js';

/**
 * Builds a full def for `register`, keeping the exact schema types. Routes
 * in teraslice use the method helpers instead, which capture them from the
 * call.
 */
function defineRoute<
    P extends ParamsSchema | undefined = undefined,
    Q extends ParamsSchema | undefined = undefined,
    B extends z.ZodType | undefined = undefined,
    R extends z.ZodType = z.ZodType,
    F extends ResponseFormat = 'json'
>(def: RouteDef<P, Q, B, R, F>): RouteDef<P, Q, B, R, F> {
    return def;
}

describe('v2 route registry', () => {
    const logger = debugLogger('v2-routes-spec');

    const getThing = defineRoute({
        operationId: 'getThing',
        method: 'get',
        path: '/things/:id',
        summary: 'Get a thing',
        params: z.strictObject({ id: z.string().regex(/^[a-z]+$/) }),
        query: z.strictObject({
            size: z.coerce.number<number>().int()
                .min(0)
                .default(10),
            verbose: z.stringbool().optional(),
        }),
        response: z.object({
            id: z.string(),
            size: z.number(),
            verbose: z.boolean().optional(),
        }),
    });

    const createThing = defineRoute({
        operationId: 'createThing',
        method: 'post',
        path: '/things',
        summary: 'Create a thing',
        body: z.object({ name: z.string(), count: z.number().default(1) }),
        response: z.object({ name: z.string(), count: z.number() }),
    });

    const ping = defineRoute({
        operationId: 'ping',
        method: 'get',
        path: '/ping',
        summary: 'Declares no params, query or body',
        response: z.object({}),
    });

    const failThing = defineRoute({
        operationId: 'failThing',
        method: 'get',
        path: '/fail',
        summary: 'Always fails',
        response: z.object({}),
    });

    const registry = createRouteRegistry();
    // Handler input for getThing and ping, so tests can check what was parsed
    const seen: unknown[] = [];

    registry.register(getThing, ({ params, query, body }) => {
        seen.push({ params, query, body });
        return { id: params.id, size: query.size, verbose: query.verbose };
    });

    registry.register(createThing, ({ body }) => body);

    registry.register(ping, (input) => {
        seen.push(input);
        return {};
    });

    registry.register(failThing, () => {
        throw new TSError('nope', { statusCode: 409 });
    }, { errorMessage: 'Could not fail' });

    // `raw` routes, on their own registry so `routes` above stays as listed
    const rawRegistry = createRouteRegistry();
    const rawResponse = z.object({ a: z.number() });

    rawRegistry.get('/raw', {
        operationId: 'getRaw',
        summary: 'Returns serialized JSON',
        response: rawResponse,
        format: 'raw',
    }, () => Buffer.from('{"a":1}'));

    rawRegistry.get('/raw-object', {
        operationId: 'getRawObject',
        summary: 'Wrongly returns an object from a raw route',
        response: rawResponse,
        format: 'raw',
    }, () => ({ a: 1 }) as unknown as Buffer);

    // `text` routes, on their own registry for the same reason
    const textRegistry = createRouteRegistry();
    const textSpec = {
        response: z.string(),
        format: 'text',
        responseHeaders: { 'X-Total-Count': 'Number of matching records' },
    } as const;

    textRegistry.get('/text', {
        ...textSpec,
        operationId: 'getText',
        summary: 'Returns a table',
    }, () => ({ body: 'id\n1\n', headers: { 'X-Total-Count': '1' } }));

    textRegistry.get('/text-no-headers', {
        ...textSpec,
        operationId: 'getTextNoHeaders',
        summary: 'Returns a table without headers',
    }, () => ({ body: '' }));

    textRegistry.get('/text-string', {
        ...textSpec,
        operationId: 'getTextString',
        summary: 'Wrongly returns a bare string from a text route',
    }, () => 'id\n1\n' as unknown as TextResult);

    textRegistry.get('/text-undeclared', {
        ...textSpec,
        operationId: 'getTextUndeclared',
        summary: 'Sends a header it does not declare',
    }, () => ({ body: '', headers: { 'X-Total-Count': '1', 'X-Nope': '1' } }));

    // `errorMessage` fallbacks, on their own registry for the same reason.
    // The fallback is only used when the thrown value has no message.
    const messageRegistry = createRouteRegistry();
    const throwEmpty = () => {
        throw '';
    };

    messageRegistry.get('/message/static', {
        operationId: 'staticMessage',
        summary: 'Throws without a message',
        response: z.object({}),
    }, throwEmpty, { errorMessage: 'Could not do it' });

    messageRegistry.get('/message/params/:id', {
        operationId: 'paramsMessage',
        summary: 'Throws without a message',
        params: z.strictObject({ id: z.string().regex(/^[a-z]+$/) }),
        response: z.object({}),
    }, throwEmpty, { errorMessage: ({ id }) => `Could not do it: ${id}` });

    // `successStatuses` and `withStatus`, on their own registry for the same reason
    const statusRegistry = createRouteRegistry();
    const statusSpec = {
        response: z.object({ id: z.string() }),
        successStatuses: { 200: 'Already existed', 201: 'Created' },
    } as const;

    statusRegistry.post('/status/:result', {
        ...statusSpec,
        operationId: 'saveStatus',
        summary: 'Sends 201 for "new", 200 otherwise',
        params: z.strictObject({ result: z.string() }),
    }, ({ params }) => (
        params.result === 'new' ? withStatus(201, { id: 'a' }) : { id: 'a' }
    ));

    statusRegistry.post('/status-undeclared', {
        ...statusSpec,
        operationId: 'saveUndeclared',
        summary: 'Sends a status it does not declare',
    }, () => withStatus(202, { id: 'a' }));

    // `binary` body routes, on their own registry for the same reason
    const binaryRegistry = createRouteRegistry();

    binaryRegistry.post('/upload', {
        operationId: 'upload',
        summary: 'Reads the body as a stream',
        bodyFormat: 'binary',
        response: z.object({ bytes: z.number(), body: z.unknown() }),
    }, async ({ body }, req) => {
        let bytes = 0;
        for await (const chunk of req) bytes += (chunk as Buffer).length;
        return { bytes, body };
    });

    let server: http.Server;
    let baseUrl: string;

    beforeAll(async () => {
        const port = await findPort();
        baseUrl = `http://localhost:${port}`;

        const app = express();
        app.use(bodyParser.json());
        app.use((req, _res, next) => {
            req.logger = logger;
            next();
        });
        app.use(registry.router);
        app.use(rawRegistry.router);
        app.use(textRegistry.router);
        app.use(messageRegistry.router);
        app.use(statusRegistry.router);
        app.use(binaryRegistry.router);

        await new Promise((resolve, reject) => {
            server = app.listen(port, (err) => {
                if (err) reject(err);
                else resolve(true);
            });
        });
    });

    afterAll(async () => {
        await new Promise((resolve) => server.close(resolve));
    });

    beforeEach(() => {
        seen.length = 0;
    });

    async function request(path: string, options: Record<string, any> = {}) {
        const response = await got(`${baseUrl}${path}`, {
            responseType: 'json',
            throwHttpErrors: false,
            ...options,
        });
        return { status: response.statusCode, body: response.body as any };
    }

    it('should track registered routes in order', () => {
        expect(registry.routes).toEqual([getThing, createThing, ping, failThing]);
        expect(createRouteRegistry().routes).toEqual([]);
    });

    describe('registering a route', () => {
        const response = z.object({});

        describe('that would drop unknown keys', () => {
            it.each([
                ['z.object', z.object({ a: z.string() })],
                ['z.looseObject', z.looseObject({ a: z.string() })],
            ])('should throw for a %s query', (_name, query) => {
                const def = defineRoute({
                    operationId: 'x', method: 'get', path: '/loose', summary: 'Loose', query, response
                });
                const loose = createRouteRegistry();

                expect(() => loose.register(def, () => ({}))).toThrow(
                    'v2 route GET /loose: query must be a z.strictObject'
                );
                expect(loose.routes).toEqual([]);
            });

            it('should throw for a z.object params', () => {
                const def = defineRoute({
                    operationId: 'x',
                    method: 'delete',
                    path: '/loose/:id',
                    summary: 'Loose',
                    params: z.object({ id: z.string() }),
                    response,
                });

                expect(() => createRouteRegistry().register(def, () => ({}))).toThrow(
                    'v2 route DELETE /loose/:id: params must be a z.strictObject'
                );
            });

            it('should accept strict schemas however they are made', () => {
                const def = defineRoute({
                    operationId: 'x',
                    method: 'get',
                    path: '/strict',
                    summary: 'Strict',
                    query: z.object({ a: z.string() }).strict()
                        .extend({ b: z.string() }),
                    response,
                });

                expect(() => createRouteRegistry().register(def, () => ({}))).not.toThrow();
            });
        });

        describe('with a response format', () => {
            it('should throw for a text route whose response is not a string schema', () => {
                const def = defineRoute({
                    operationId: 'x',
                    method: 'get',
                    path: '/text',
                    summary: 'Text',
                    response,
                    format: 'text',
                });

                expect(() => createRouteRegistry().register(def, () => ({ body: '' }))).toThrow(
                    'v2 route GET /text: a text route\'s response must be a string schema'
                );
            });

            it.each(['json', 'raw', undefined] as const)(
                'should throw for responseHeaders on a %s route',
                (format) => {
                    const def = defineRoute({
                        operationId: 'x',
                        method: 'get',
                        path: '/json',
                        summary: 'JSON',
                        response,
                        format,
                        responseHeaders: { 'X-Total-Count': 'Total' },
                    });

                    expect(() => createRouteRegistry().register(def, () => ({}) as any)).toThrow(
                        'v2 route GET /json: only a text route can have responseHeaders'
                    );
                }
            );

            it.each(['raw', 'text'] as const)(
                'should throw for successStatuses on a %s route',
                (format) => {
                    const def = defineRoute({
                        operationId: 'x',
                        method: 'get',
                        path: '/other',
                        summary: 'Other',
                        response: z.string(),
                        format,
                        successStatuses: { 201: 'Created' },
                    });

                    expect(() => createRouteRegistry().register(def, () => ({}) as any)).toThrow(
                        'v2 route GET /other: only a json route can have successStatuses'
                    );
                }
            );

            it('should throw for successStatuses that are not 2xx', () => {
                const def = defineRoute({
                    operationId: 'x',
                    method: 'post',
                    path: '/json',
                    summary: 'JSON',
                    response,
                    successStatuses: { 201: 'Created', 302: 'Moved', 404: 'Missing' },
                });

                expect(() => createRouteRegistry().register(def, () => ({}))).toThrow(
                    'v2 route POST /json: successStatuses must be 2xx, got 302, 404'
                );
            });

            it('should accept 2xx successStatuses on a json route', () => {
                const def = defineRoute({
                    operationId: 'x',
                    method: 'post',
                    path: '/json',
                    summary: 'JSON',
                    response,
                    format: 'json',
                    successStatuses: { 200: 'Existed', 201: 'Created' },
                });

                expect(() => createRouteRegistry().register(def, () => ({}))).not.toThrow();
            });
        });

        describe('with a binary body', () => {
            it('should throw when the route also has a body schema', () => {
                const def = defineRoute({
                    operationId: 'x',
                    method: 'post',
                    path: '/upload',
                    summary: 'Upload',
                    body: z.object({}),
                    bodyFormat: 'binary',
                    response,
                });

                expect(() => createRouteRegistry().register(def, () => ({}))).toThrow(
                    'v2 route POST /upload: a binary body route can\'t have a body schema'
                );
            });

            it.each(['get', 'delete'] as const)('should throw on a %s route', (method) => {
                const def = defineRoute({
                    operationId: 'x',
                    method,
                    path: '/upload',
                    summary: 'Upload',
                    bodyFormat: 'binary',
                    response,
                });

                expect(() => createRouteRegistry().register(def, () => ({}))).toThrow(
                    `v2 route ${method.toUpperCase()} /upload: a ${method} route can't take a binary body`
                );
            });
        });

        describe('that is already registered', () => {
            const route = (operationId: string, method: 'get' | 'post', path: string) => defineRoute({
                operationId, method, path, summary: 'Dup', response
            });

            it('should throw for the same method and path', () => {
                const dup = createRouteRegistry();
                dup.register(route('first', 'get', '/dup'), () => ({}));

                expect(() => dup.register(route('second', 'get', '/dup'), () => ({}))).toThrow(
                    'v2 route GET /dup: already registered'
                );
                expect(dup.routes.map((r) => r.operationId)).toEqual(['first']);
            });

            it('should throw for the same operationId', () => {
                const dup = createRouteRegistry();
                dup.register(route('same', 'get', '/a'), () => ({}));

                expect(() => dup.register(route('same', 'get', '/b'), () => ({}))).toThrow(
                    'v2 route GET /b: operationId "same" is already used by v2 route GET /a'
                );
            });

            it('should accept the same path with a different method', () => {
                const dup = createRouteRegistry();
                dup.register(route('getIt', 'get', '/dup'), () => ({}));

                expect(() => dup.register(route('postIt', 'post', '/dup'), () => ({}))).not.toThrow();
            });

            it('should allow the same route on separate registries', () => {
                const def = route('shared', 'get', '/shared');
                createRouteRegistry().register(def, () => ({}));

                expect(() => createRouteRegistry().register(def, () => ({}))).not.toThrow();
            });
        });

        describe('whose params schema does not match its path', () => {
            it('should throw when the path has params but there is no params schema', () => {
                const def = defineRoute({
                    operationId: 'x', method: 'get', path: '/jobs/:jobId', summary: 'No params', response
                });
                const rejecting = createRouteRegistry();

                expect(() => rejecting.register(def, () => ({}))).toThrow(
                    'v2 route GET /jobs/:jobId: params schema must match path params (missing from params schema: jobId)'
                );
                expect(rejecting.routes).toEqual([]);
            });

            it('should throw when the params schema is missing a path param', () => {
                const def = defineRoute({
                    operationId: 'x',
                    method: 'get',
                    path: '/jobs/:jobId/ex/:exId',
                    summary: 'Missing',
                    params: z.strictObject({ jobId: z.string() }),
                    response,
                });

                expect(() => createRouteRegistry().register(def, () => ({}))).toThrow(
                    '(missing from params schema: exId)'
                );
            });

            it('should throw when the params schema has a key that is not in the path', () => {
                const def = defineRoute({
                    operationId: 'x',
                    method: 'get',
                    path: '/jobs/:jobId',
                    summary: 'Extra',
                    params: z.strictObject({ jobId: z.string(), exId: z.string() }),
                    response,
                });

                expect(() => createRouteRegistry().register(def, () => ({}))).toThrow(
                    '(not in path: exId)'
                );
            });

            it('should report missing and extra keys together', () => {
                const def = defineRoute({
                    operationId: 'x',
                    method: 'get',
                    path: '/jobs/:jobId',
                    summary: 'Typo',
                    params: z.strictObject({ job_id: z.string() }),
                    response,
                });

                expect(() => createRouteRegistry().register(def, () => ({}))).toThrow(
                    '(missing from params schema: jobId; not in path: job_id)'
                );
            });

            it('should throw when there is a params schema but the path has no params', () => {
                const def = defineRoute({
                    operationId: 'x',
                    method: 'get',
                    path: '/jobs',
                    summary: 'No path params',
                    params: z.strictObject({ jobId: z.string() }),
                    response,
                });

                expect(() => createRouteRegistry().register(def, () => ({}))).toThrow(
                    '(not in path: jobId)'
                );
            });

            it('should accept named wildcards', () => {
                const def = defineRoute({
                    operationId: 'x',
                    method: 'get',
                    path: '/files/*filePath',
                    summary: 'Wildcard',
                    params: z.strictObject({ filePath: z.array(z.string()) }),
                    response,
                });

                expect(() => createRouteRegistry().register(def, () => ({}))).not.toThrow();
            });
        });
    });

    describe('registering a route with a method helper', () => {
        const spec = {
            operationId: 'getWidget',
            summary: 'Get a widget',
            params: z.strictObject({ id: z.string() }),
            query: z.strictObject({ size: z.coerce.number<number>().default(1) }),
            response: z.object({ id: z.string(), size: z.number() }),
        };

        it('should record the def with the method and path from the call', () => {
            const helper = createRouteRegistry();
            helper.get('/widgets/:id', spec, ({ params, query }) => ({
                id: params.id, size: query.size
            }));

            expect(helper.routes).toEqual([{ ...spec, method: 'get', path: '/widgets/:id' }]);
        });

        it('should run the same registration checks as register', () => {
            const helper = createRouteRegistry();

            expect(() => helper.delete('/widgets', spec, () => ({ id: 'a', size: 1 }))).toThrow(
                'v2 route DELETE /widgets: params schema must match path params (not in path: id)'
            );
        });

        it('should type the handler from the spec', () => {
            expect(() => {
                const helper = createRouteRegistry();
                helper.get('/widgets/:id', spec, ({ params, query, body }) => {
                    const id: string = params.id;
                    const size: number = query.size;
                    const noBody: undefined = body;
                    return noBody ?? { id, size };
                });

                // @ts-expect-error size must be a number
                createRouteRegistry().put('/widgets/:id', spec, () => ({ id: 'a', size: 'big' }));
            }).not.toThrow();
        });
    });

    describe('a raw route', () => {
        it('should send the Buffer as-is with a JSON content type', async () => {
            const response = await got(`${baseUrl}/raw`, { throwHttpErrors: false });

            expect(response.statusCode).toBe(200);
            expect(response.headers['content-type']).toStartWith('application/json');
            expect(response.body).toBe('{"a":1}');
        });

        it('should respond with a 500 if the handler does not return a Buffer', async () => {
            const { status, body } = await request('/raw-object');

            expect(status).toBe(500);
            expect(body.message).toContain('v2 route GET /raw-object: raw handler must return a Buffer');
        });

        it('should record the format on the def', () => {
            expect(rawRegistry.routes.map((r) => r.format)).toEqual(['raw', 'raw']);
        });
    });

    describe('a text route', () => {
        it('should send the body as text/plain with its headers', async () => {
            const response = await got(`${baseUrl}/text`, { throwHttpErrors: false });

            expect(response.statusCode).toBe(200);
            expect(response.headers['content-type']).toStartWith('text/plain');
            expect(response.headers['x-total-count']).toBe('1');
            expect(response.body).toBe('id\n1\n');
        });

        it('should send an empty body as text/plain', async () => {
            const response = await got(`${baseUrl}/text-no-headers`, { throwHttpErrors: false });

            expect(response.statusCode).toBe(200);
            expect(response.headers['content-type']).toStartWith('text/plain');
            expect(response.headers).not.toHaveProperty('x-total-count');
            expect(response.body).toBe('');
        });

        it('should respond with a 500 if the handler does not return { body }', async () => {
            const { status, body } = await request('/text-string');

            expect(status).toBe(500);
            expect(body.message).toContain(
                'v2 route GET /text-string: text handler must return { body: string }'
            );
        });

        it('should respond with a 500 for a header not in responseHeaders', async () => {
            const { status, body } = await request('/text-undeclared');

            expect(status).toBe(500);
            expect(body.message).toContain(
                'v2 route GET /text-undeclared: headers not in responseHeaders: X-Nope'
            );
        });

        it('should be documented as text/plain with its headers', () => {
            const spec = generateV2Spec(textRegistry.routes, new TestContext('v2-routes-spec') as any);

            expect(spec.paths?.['/v2/text'].get?.responses?.[200]).toEqual({
                description: 'Success',
                content: { 'text/plain': { schema: expect.objectContaining({ type: 'string' }) } },
                headers: {
                    'X-Total-Count': {
                        description: 'Number of matching records',
                        schema: { type: 'string' },
                    },
                },
            });
        });

        it('should keep raw routes documented as JSON', () => {
            const spec = generateV2Spec(rawRegistry.routes, new TestContext('v2-routes-spec') as any);

            expect(spec.paths?.['/v2/raw'].get?.responses?.[200]?.content)
                .toContainKey('application/json');
        });
    });

    describe('a route with successStatuses', () => {
        it('should send the status of a withStatus result', async () => {
            const { status, body } = await request('/status/new', { method: 'POST' });

            expect(status).toBe(201);
            expect(body).toEqual({ id: 'a' });
        });

        it('should send a 200 for a plain result', async () => {
            const { status, body } = await request('/status/old', { method: 'POST' });

            expect(status).toBe(200);
            expect(body).toEqual({ id: 'a' });
        });

        it('should respond with a 500 for a status not in successStatuses', async () => {
            const { status, body } = await request('/status-undeclared', { method: 'POST' });

            expect(status).toBe(500);
            expect(body.message).toContain(
                'v2 route POST /status-undeclared: status 202 is not in successStatuses'
            );
        });

        it('should document every status with the response body', () => {
            const spec = generateV2Spec(statusRegistry.routes, new TestContext('v2-routes-spec') as any);
            const { responses } = spec.paths?.['/v2/status/{result}'].post ?? {};
            const content = {
                'application/json': { schema: expect.objectContaining({ type: 'object' }) },
            };

            expect(responses).toEqual({
                200: { description: 'Already existed', content },
                201: { description: 'Created', content },
                default: { $ref: '#/components/responses/Error' },
            });
        });

        it('should document 200 as Success when it is not listed', () => {
            const routes = [{ ...statusRegistry.routes[0], successStatuses: { 201: 'Created' } }];
            const spec = generateV2Spec(routes, new TestContext('v2-routes-spec') as any);
            const { responses } = spec.paths?.['/v2/status/{result}'].post ?? {};

            expect(responses?.[200]?.description).toBe('Success');
            expect(responses?.[201]?.description).toBe('Created');
        });
    });

    describe('a binary body route', () => {
        it('should leave the body on req for the handler to stream', async () => {
            const { status, body } = await request('/upload', {
                method: 'POST',
                body: Buffer.alloc(1024, 1),
                headers: { 'content-type': 'application/octet-stream' },
            });

            expect(status).toBe(200);
            expect(body).toEqual({ bytes: 1024 });
        });

        it('should accept a body sent without a content type', async () => {
            const { status, body } = await request('/upload', {
                method: 'POST',
                body: Buffer.alloc(10, 1),
            });

            expect(status).toBe(200);
            expect(body).toEqual({ bytes: 10 });
        });

        it('should record the body format on the def', () => {
            expect(binaryRegistry.routes[0].bodyFormat).toBe('binary');
        });

        it('should be documented as an octet-stream request body', () => {
            const spec = generateV2Spec(binaryRegistry.routes, new TestContext('v2-routes-spec') as any);

            expect(spec.paths?.['/v2/upload'].post?.requestBody).toEqual({
                required: true,
                content: {
                    'application/octet-stream': { schema: { type: 'string', format: 'binary' } },
                },
            });
        });
    });

    describe('handling a request', () => {
        it('should pass parsed params and query to the handler with defaults applied', async () => {
            const { status, body } = await request('/things/abc');

            expect(status).toBe(200);
            expect(body).toEqual({ id: 'abc', size: 10 });
            expect(seen).toEqual([{
                params: { id: 'abc' },
                query: { size: 10 },
                body: undefined,
            }]);
        });

        it('should pass undefined for parts the route does not declare', async () => {
            const { status } = await request('/ping');

            expect(status).toBe(200);
            expect(seen).toEqual([{ params: undefined, query: undefined, body: undefined }]);
        });

        it('should coerce query strings', async () => {
            const { status, body } = await request('/things/abc', {
                searchParams: { size: '5', verbose: 'true' }
            });

            expect(status).toBe(200);
            expect(body).toEqual({ id: 'abc', size: 5, verbose: true });
        });

        it('should parse the body with defaults applied', async () => {
            const { status, body } = await request('/things', {
                method: 'POST',
                json: { name: 'thing' },
            });

            expect(status).toBe(200);
            expect(body).toEqual({ name: 'thing', count: 1 });
        });

        it('should respond with a 400 for invalid params', async () => {
            const { status, body } = await request('/things/ABC');

            expect(status).toBe(400);
            expect(body).toEqual({ error: 400, message: expect.stringContaining('Invalid request params') });
            expect(body.message).toContain('id');
            expect(seen).toEqual([]);
        });

        it('should respond with a 400 for an invalid query', async () => {
            const { status, body } = await request('/things/abc', { searchParams: { size: '-1' } });

            expect(status).toBe(400);
            expect(body.error).toBe(400);
            expect(body.message).toContain('Invalid request query');
            expect(body.message).toContain('size');
            expect(seen).toEqual([]);
        });

        it('should respond with a 400 for unknown query params', async () => {
            const { status, body } = await request('/things/abc', {
                searchParams: { size: '5', extra: 'x', _: '1' }
            });

            expect(status).toBe(400);
            expect(body.message).toContain('Invalid request query');
            expect(body.message).toContain('Unrecognized keys: "extra", "_"');
            expect(seen).toEqual([]);
        });

        it('should respond with a 400 for an invalid body', async () => {
            const { status, body } = await request('/things', {
                method: 'POST',
                json: { name: 42 },
            });

            expect(status).toBe(400);
            expect(body.message).toContain('Invalid request body');
            expect(body.message).toContain('name');
        });

        it('should respond with the status of errors thrown by the handler', async () => {
            const { status, body } = await request('/fail');

            expect(status).toBe(409);
            expect(body).toEqual({ error: 409, message: 'nope' });
        });

        describe('errorMessage', () => {
            it('should be used when the handler throws without a message', async () => {
                const { status, body } = await request('/message/static');

                expect(status).toBe(500);
                expect(body.message).toBe('Could not do it');
            });

            it('should be built from the path params when it is a function', async () => {
                const { status, body } = await request('/message/params/abc');

                expect(status).toBe(500);
                expect(body.message).toBe('Could not do it: abc');
            });

            it('should not replace a handler error\'s own message', async () => {
                const { body } = await request('/fail');

                expect(body.message).toBe('nope');
            });

            it('should not replace a validation error', async () => {
                const { status, body } = await request('/message/params/ABC');

                expect(status).toBe(400);
                expect(body.message).toContain('Invalid request params');
            });
        });

        describe('to a route with no query schema', () => {
            it('should respond with a 400 for any query param', async () => {
                const { status, body } = await request('/ping', { searchParams: { foo: 'bar' } });

                expect(status).toBe(400);
                expect(body.message).toContain('Invalid request query');
                expect(body.message).toContain('Unrecognized key: "foo"');
                expect(seen).toEqual([]);
            });

            it('should reject query params on a route that has a body schema', async () => {
                const { status, body } = await request('/things', {
                    method: 'POST',
                    json: { name: 'thing' },
                    searchParams: { start: 'false' },
                });

                expect(status).toBe(400);
                expect(body.message).toContain('Unrecognized key: "start"');
            });
        });

        describe('to a route with no body schema', () => {
            it('should respond with a 400 for a non-empty body', async () => {
                const { status, body } = await request('/things/abc', {
                    method: 'GET',
                    allowGetBody: true,
                    json: { name: 'thing' },
                });

                expect(status).toBe(400);
                expect(body.message).toContain('Invalid request body');
                expect(body.message).toContain('does not accept a request body');
                expect(seen).toEqual([]);
            });

            it('should respond with a 400 for a non-object body', async () => {
                const { status } = await request('/things/abc', {
                    method: 'GET',
                    allowGetBody: true,
                    json: [1],
                });

                expect(status).toBe(400);
            });

            it('should accept an empty JSON object', async () => {
                const { status } = await request('/things/abc', {
                    method: 'GET',
                    allowGetBody: true,
                    json: {},
                });

                expect(status).toBe(200);
                expect(seen).toEqual([{ params: { id: 'abc' }, query: { size: 10 }, body: undefined }]);
            });
        });
    });

    // These are checked by tsc, not jest: an unused @ts-expect-error is a
    // compile error, so if inference ever degrades to `any` these fail.
    // Each route is registered on its own router (never mounted), since a
    // registry rejects the same route twice.
    describe('types', () => {
        const typed = () => createRouteRegistry();

        it('should type handler input from the parsed schemas', () => {
            expect(() => {
                typed().register(getThing, ({ params, query, body }) => {
                    const id: string = params.id;
                    const size: number = query.size;
                    const verbose: boolean | undefined = query.verbose;
                    const noBody: undefined = body;
                    return noBody ?? { id, size, verbose };
                });

                typed().register(getThing, ({ query }) => {
                    // @ts-expect-error unknown query key
                    const missing = query.nope;
                    return { id: String(missing), size: 1 };
                });

                typed().register(getThing, ({ body }) => {
                    // @ts-expect-error route has no body
                    const name = body.name;
                    return { id: String(name), size: 1 };
                });
            }).not.toThrow();
        });

        it('should type an errorMessage function\'s params from the params schema', () => {
            expect(() => {
                typed().register(getThing, () => ({ id: 'a', size: 1 }), {
                    errorMessage: ({ id }) => `Could not get thing ${id}`,
                });

                typed().register(getThing, () => ({ id: 'a', size: 1 }), {
                    // @ts-expect-error not a path param
                    errorMessage: ({ thingId }) => `Could not get thing ${thingId}`,
                });

                typed().register(ping, () => ({}), {
                    // @ts-expect-error route has no path params
                    errorMessage: ({ id }) => `Could not ping ${id}`,
                });
            }).not.toThrow();
        });

        it('should type handler return from the response schema', () => {
            expect(() => {
                // @ts-expect-error size must be a number
                typed().register(getThing, () => ({ id: 'a', size: 'big' }));

                // @ts-expect-error id is required
                typed().register(getThing, () => ({ size: 1 }));

                // @ts-expect-error async handlers are checked too
                typed().register(getThing, async () => ({ id: 1, size: 1 }));

                // Responses aren't parsed, so a defaulted field is required from
                // the handler, matching what clients are told they receive
                const withDefault = defineRoute({
                    operationId: 'getDefaulted',
                    method: 'get',
                    path: '/defaulted',
                    summary: 'Response with a default',
                    response: z.object({ count: z.number().default(0) }),
                });
                // @ts-expect-error count has a default but is still required
                typed().register(withDefault, () => ({}));
                typed().register(withDefault, () => ({ count: 1 }));
            }).not.toThrow();
        });

        it('should type a raw handler as returning a Buffer', () => {
            expect(() => {
                const raw = createRouteRegistry();
                const spec = {
                    operationId: 'x', summary: 'X', response: z.object({ a: z.number() }),
                };

                raw.get('/raw', { ...spec, format: 'raw' }, () => Buffer.from('{}'));
                // @ts-expect-error a raw route returns a Buffer, not the response object
                raw.get('/raw2', { ...spec, operationId: 'y', format: 'raw' }, () => ({ a: 1 }));
                // @ts-expect-error without raw, a Buffer isn't the response object
                raw.get('/plain', { ...spec, operationId: 'z' }, () => Buffer.from('{}'));
            }).not.toThrow();
        });

        it('should type a text handler as returning a TextResult', () => {
            expect(() => {
                const text = createRouteRegistry();
                const spec = { operationId: 'x', summary: 'X', response: z.string() };

                text.get('/text', { ...spec, format: 'text' }, () => ({ body: 'a' }));
                text.get('/text2', { ...spec, operationId: 'y', format: 'text' }, () => ({
                    body: 'a', headers: { 'X-Total-Count': '1' }
                }));
                // @ts-expect-error a text route returns { body }, not a bare string
                text.get('/text3', { ...spec, operationId: 'z', format: 'text' }, () => 'a');
                text.get('/text4', { ...spec, operationId: 'w', format: 'text' }, () => ({
                    // @ts-expect-error header values are strings
                    body: 'a', headers: { 'X-Total-Count': 1 }
                }));
                // @ts-expect-error not a ResponseFormat
                text.get('/text5', { ...spec, operationId: 'v', format: 'csv' }, () => 'a');
            }).not.toThrow();
        });

        it('should type withStatus results from the response schema', () => {
            expect(() => {
                const json = createRouteRegistry();
                const spec = {
                    operationId: 'x', summary: 'X', response: z.object({ a: z.number() }),
                };

                json.post('/ok', spec, () => withStatus(201, { a: 1 }));
                // @ts-expect-error the body must match the response schema
                json.post('/bad', { ...spec, operationId: 'y' }, () => withStatus(201, { a: 'b' }));
                // @ts-expect-error a text route can't return withStatus
                json.get('/text', { ...spec, operationId: 'z', response: z.string(), format: 'text' }, () => withStatus(201, { body: 'a' }));
            }).not.toThrow();
        });

        it('should require an operationId', () => {
            // @ts-expect-error operationId is required
            const def = defineRoute({
                method: 'get', path: '/x', summary: 'X', response: z.object({})
            });
            expect(def.operationId).toBeUndefined();
        });

        it('should only accept known tags', () => {
            const def = defineRoute({
                operationId: 'x',
                method: 'get',
                path: '/x',
                summary: 'X',
                // @ts-expect-error not a RouteTag
                tags: ['Nope'],
                response: z.object({}),
            });
            expect(def.tags).toEqual(['Nope']);
        });

        it('should type client requests from the schema inputs', () => {
            // Clients type requests as z.input and responses as z.output of the
            // shared schemas (e.g. `GetJobQuery` in @terascope/types)
            type Params = z.input<NonNullable<typeof getThing.params>>;
            type Query = z.input<NonNullable<typeof getThing.query>>;
            type Body = z.input<NonNullable<typeof createThing.body>>;
            type Response = z.output<typeof createThing.response>;

            const params: Params = { id: 'abc' };
            // defaulted fields are optional for clients; coerced fields keep their type
            const query: Query = { size: 5, verbose: 'true' };
            const emptyQuery: Query = {};
            const body: Body = { name: 'thing' };
            const response: Response = { name: 'thing', count: 1 };

            // @ts-expect-error size is a number, not unknown
            const badQuery: Query = { size: 'five' };
            // @ts-expect-error count is not optional in the response
            const badResponse: Response = { name: 'thing' };

            expect([
                params, query, emptyQuery, body, response, badQuery, badResponse
            ]).toHaveLength(7);
        });
    });
});
