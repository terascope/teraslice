import { z } from 'zod';
import type {
    OpenAPIObject, OperationObject, ParameterObject, PathsObject,
    ReferenceObject, ResponsesObject, SchemaObject
} from 'openapi3-ts/oas31';
import { isDeepEqual, isPlainObject } from '@terascope/core-utils';
import { generateJobJSONSchema } from '@terascope/job-components';
import { TerasliceApiV2 } from '@terascope/types';
import type { ClusterMasterContext } from '../../../../../interfaces.js';
import { getPackageJSON } from '../../../../utils/file_utils.js';
import type { AnyRouteDef, ParamsSchema } from '../../../../utils/v2_routes.js';

const terasliceVersion = getPackageJSON().version;

/*
 * An OpenAPI spec has `paths` (the endpoints) and `components.schemas`
 * (named schemas). A schema describes what some JSON looks like. Instead
 * of repeating a schema, the spec can write it once in `components.schemas`
 * and point to it with a `$ref`, e.g.
 * `{ $ref: '#/components/schemas/JobRecord' }`.
 * Named schemas can be responses, request bodies, or pieces of other
 * schemas, and can `$ref` each other.
 */

/** The named schemas, by name. Becomes `components.schemas` */
type Components = Record<string, SchemaObject>;

/** A schema written out in full, or a `$ref` to one in `Components` */
type Schema = SchemaObject | ReferenceObject;

function componentRef(name: string): ReferenceObject {
    return { $ref: `#/components/schemas/${name}` };
}

function jsonContent(schema: Schema) {
    return { 'application/json': { schema } };
}

function successResponses(schema: Schema, description = 'Success'): ResponsesObject {
    return {
        200: { description, content: jsonContent(schema) },
        default: { $ref: '#/components/responses/Error' },
    };
}

/**
 * Points every ref that starts with `refPrefix` at `components.schemas`,
 * e.g. `#/$defs/JobRecord` → `#/components/schemas/JobRecord`.
 */
function pointRefsAtComponents(
    value: unknown,
    refPrefix: string,
    renames: Record<string, string>
): any {
    if (Array.isArray(value)) {
        return value.map((item) => pointRefsAtComponents(item, refPrefix, renames));
    }
    if (!isPlainObject(value)) return value;

    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
        if (key === '$ref' && typeof item === 'string' && item.startsWith(refPrefix)) {
            const name = item.slice(refPrefix.length);
            result[key] = componentRef(renames[name] ?? name).$ref;
        } else {
            result[key] = pointRefsAtComponents(item, refPrefix, renames);
        }
    }
    return result;
}

/**
 * Zod and the job schema each put shared schemas inside the schema they
 * generate (under `$defs` or `definitions`) and ref them from there. In an
 * OpenAPI document those refs would point at nothing, so this moves the
 * shared schemas into `components.schemas` and repoints the refs.
 *
 * @param renames - new component names, by definition name
 */
function moveDefinitionsToComponents(
    jsonSchema: Record<string, any>,
    definitionsKey: '$defs' | 'definitions',
    components: Components,
    renames: Record<string, string> = {}
): SchemaObject {
    const refPrefix = `#/${definitionsKey}/`;
    const { [definitionsKey]: definitions = {}, ...schema } = jsonSchema;
    delete schema.$schema;
    delete schema.$id;

    for (const [name, definition] of Object.entries(definitions)) {
        const componentName = renames[name] ?? name;
        const component = pointRefsAtComponents(definition, refPrefix, renames);

        if (components[componentName] && !isDeepEqual(components[componentName], component)) {
            throw new Error(`OpenAPI component "${componentName}" is defined twice with different schemas`);
        }
        components[componentName] = component;
    }

    return pointRefsAtComponents(schema, refPrefix, renames);
}

/**
 * Converts a zod schema. Schemas named with `.meta({ id })` become
 * components. Use `input` for request schemas and `output` for responses:
 * they differ on fields with defaults, which are optional in a request but
 * always set in a response.
 */
function fromZod(
    schema: z.ZodType,
    io: 'input' | 'output',
    components: Components
): Schema {
    return moveDefinitionsToComponents(z.toJSONSchema(schema, { io }), '$defs', components);
}

/** One `parameters[]` entry per property of a params or query schema */
function toParameters(
    schema: ParamsSchema | undefined,
    location: 'path' | 'query',
    components: Components
): ParameterObject[] {
    if (!schema) return [];

    const objectSchema = fromZod(schema, 'input', components) as SchemaObject;
    const required = objectSchema.required ?? [];

    return Object.entries(objectSchema.properties ?? {}).map(([name, property]) => {
        const { description, ...propertySchema } = property as SchemaObject;
        return {
            name,
            in: location,
            required: location === 'path' || required.includes(name),
            ...(description && { description }),
            schema: propertySchema,
        };
    });
}

/**
 * Turns one registered route into its entry in the spec. OpenAPI calls one
 * method on one path an "operation", hence the name. `generateV2Spec` calls
 * this once per route and stores the result at `paths[path][method]`.
 *
 * @param route - what was passed to `registry.get(...)` (or another method
 * helper), plus its method and path. Uses its operationId, summary, tags,
 * and the params, query, body and response zod schemas.
 * @param components - the spec's named schemas. Passed down to `fromZod` so
 * any named schema found while converting is added to it.
 * @returns the operation, e.g. for `getJob`:
 * `{ operationId, summary, tags, parameters: [jobId, ex], responses: { 200, default } }`
 */
function toOperation(route: AnyRouteDef, components: Components): OperationObject {
    const operation: OperationObject = {
        operationId: route.operationId,
        summary: route.summary,
        responses: successResponses(fromZod(route.response, 'output', components)),
    };

    if (route.tags) operation.tags = [...route.tags];

    const parameters = [
        ...toParameters(route.params, 'path', components),
        ...toParameters(route.query, 'query', components),
    ];
    if (parameters.length) operation.parameters = parameters;

    if (route.body) {
        operation.requestBody = {
            required: true,
            content: jsonContent(fromZod(route.body, 'input', components)),
        };
    }

    return operation;
}

/**
 * Adds in a v2 path prefix safely to a route. This is because express handles the v2 routes.
 * Also converts the express route syntax to what openapi expects.
 * Example: /jobs/:jobId --> /v2/jobs/{jobId}
 * @param path - a registry route path, without the /v2 prefix, e.g. `/jobs/:jobId/_start`
 * @returns the path as the spec shows it, e.g. `/v2/jobs/{jobId}/_start`
 */
function convertToOpenAPIPath(path: string): string {
    let converted = '';
    let insideParam = false;

    for (const char of path) {
        if (char === ':') {
            converted += '{';
            insideParam = true;
        } else if (char === '/' && insideParam) {
            converted += '}/';
            insideParam = false;
        } else {
            converted += char;
        }
    }

    if (insideParam) converted += '}';

    return `/v2${converted === '/' ? '' : converted}`;
}

/**
 * Adds `POST /v2/jobs` (submit) and `PUT /v2/jobs/{jobId}` (update) to the
 * spec by hand. They're still plain express routes, not registry routes, so
 * they aren't in `routes` and the loop in `generateV2Spec` never sees them.
 *
 * Runs after that loop, so `paths` already has `GET /v2/jobs` and
 * `GET`/`DELETE /v2/jobs/{jobId}`; this adds `.post` and `.put` next to them.
 * The request body is the cluster's job schema, added to `components` as
 * `JobConfig`. The responses come from existing zod schemas.
 *
 * TODO: drop this once both routes are registered with `registry.post`/`.put`
 */
function addJobConfigRoutes(
    paths: PathsObject,
    context: ClusterMasterContext,
    components: Components
): void {
    const renames = { operation: 'JobOperation', api: 'JobAPI' };
    components.JobConfig = moveDefinitionsToComponents(
        generateJobJSONSchema(context), 'definitions', components, renames
    );
    const requestBody = { required: true, content: jsonContent(componentRef('JobConfig')) };

    paths['/v2/jobs'] ??= {};
    paths['/v2/jobs'].post = {
        operationId: 'submitJob',
        summary: 'Submit a job, and start it unless `start` is false',
        tags: ['Jobs'],
        parameters: [{
            name: 'start',
            in: 'query',
            required: false,
            description: 'Set to false to save the job without starting it',
            schema: { type: 'boolean', default: true },
        }],
        requestBody,
        responses: successResponses(
            fromZod(TerasliceApiV2.NewExecutionSchema.partial({ ex_id: true }), 'output', components),
            'Success. `ex_id` is only set when the job was started'
        ),
    };

    paths['/v2/jobs/{jobId}'] ??= {};
    paths['/v2/jobs/{jobId}'].put = {
        operationId: 'updateJob',
        summary: 'Replace a job\'s config',
        tags: ['Jobs'],
        parameters: [{ name: 'jobId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody,
        responses: successResponses(
            fromZod(TerasliceApiV2.UpdatedJobSchema, 'output', components)
        ),
    };
}

/**
 * Builds the OpenAPI 3.1 document for the /v2 API from the registered route
 * defs, plus the job submit and update routes, whose body is the job schema
 * for this cluster's `cluster_manager_type`.
 */
export function generateV2Spec(
    routes: readonly AnyRouteDef[],
    context: ClusterMasterContext
): OpenAPIObject {
    const components: Components = {
        ErrorResponse: {
            type: 'object',
            properties: {
                error: { type: 'integer', description: 'HTTP status code' },
                message: { type: 'string' },
            },
            required: ['error', 'message'],
        },
    };
    const paths: PathsObject = {};

    for (const route of routes) {
        const path = convertToOpenAPIPath(route.path);
        paths[path] ??= {};
        paths[path][route.method] = toOperation(route, components);
    }

    addJobConfigRoutes(paths, context, components);

    return {
        openapi: '3.1.0',
        info: {
            title: 'Teraslice API',
            version: terasliceVersion,
            description: 'Management API for the Teraslice distributed computing platform.',
        },
        tags: [
            { name: 'Cluster', description: 'Cluster state and configuration' },
            { name: 'Jobs', description: 'Job definitions and lifecycle' },
            { name: 'Executions', description: 'Execution records, read only' },
        ],
        paths,
        components: {
            schemas: components,
            responses: {
                Error: {
                    description: 'Error response',
                    content: jsonContent(componentRef('ErrorResponse')),
                },
            },
        },
    };
}
