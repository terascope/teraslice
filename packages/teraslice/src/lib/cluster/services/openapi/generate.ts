import type {
    OpenAPIObject, OperationObject, PathItemObject,
    PathsObject, ParameterObject, ResponsesObject
} from 'openapi3-ts/oas31';
import { generateJobJSONSchema } from '@terascope/job-components';
import type { ClusterMasterContext } from '../../../../interfaces.js';
import { getPackageJSON } from '../../../utils/file_utils.js';
import { routes, RouteDef } from './routes.js';

const terasliceVersion = getPackageJSON().version;

function pathParams(expressPath: string): ParameterObject[] {
    const matches = expressPath.match(/:(\w+)/g) ?? [];
    return matches.map((m) => {
        const name = m.slice(1);
        const description = name === 'jobId'
            ? 'The job ID'
            : name === 'exId' ? 'The execution ID' : name;
        return {
            name,
            in: 'path',
            required: true,
            description,
            schema: { type: 'string' }
        };
    });
}

function toOpenAPIPath(expressPath: string): string {
    const converted = expressPath.replace(/:(\w+)/g, '{$1}');
    return `/v1${converted === '/' ? '' : converted}`;
}

function buildResponses(response: RouteDef['response']): ResponsesObject {
    let schema: Record<string, any>;
    if (response === 'array') {
        schema = { type: 'array', items: { type: 'object' } };
    } else if (response === 'string') {
        schema = { type: 'string' };
    } else {
        schema = { type: 'object' };
    }

    return {
        200: {
            description: 'Successful response',
            content: { 'application/json': { schema } }
        },
        default: { $ref: '#/components/responses/Error' }
    };
}

function buildOperation(route: RouteDef, expressPath: string): OperationObject {
    const parameters = [...pathParams(expressPath), ...(route.query ?? [])];
    const operation: OperationObject = {
        summary: route.summary,
        tags: route.tags,
        responses: buildResponses(route.response)
    };

    if (parameters.length) {
        operation.parameters = parameters;
    }

    if (route.body) {
        operation.requestBody = {
            required: true,
            content: {
                'application/json': { schema: { $ref: `#/components/schemas/${route.body}` } }
            }
        };
    }

    return operation;
}

/**
 * Builds an OpenAPI 3.1 document describing the Teraslice v1 JSON management API.
 * The job schema is generated from the live cluster config so it reflects the
 * cluster_manager_type, and the spec is produced from the route registry rather
 * than a hand-maintained file.
 */
export function generateOpenapiSpec(context: ClusterMasterContext): OpenAPIObject {
    const paths: PathsObject = {};

    for (const route of routes) {
        for (const expressPath of route.paths) {
            const openapiPath = toOpenAPIPath(expressPath);
            const pathItem: PathItemObject = paths[openapiPath] ?? {};

            for (const method of route.methods) {
                pathItem[method] = buildOperation(route, expressPath);
            }

            paths[openapiPath] = pathItem;
        }
    }

    return {
        openapi: '3.1.0',
        info: {
            title: 'Teraslice API',
            version: terasliceVersion,
            description: 'Management API for the Teraslice distributed computing platform.'
        },
        tags: [
            { name: 'cluster', description: 'Cluster state and configuration' },
            { name: 'jobs', description: 'Job definitions and lifecycle' },
            { name: 'executions', description: 'Execution contexts and control' },
            { name: 'meta', description: 'API metadata' }
        ],
        paths,
        components: {
            schemas: {
                JobConfig: generateJobJSONSchema(context),
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        error: { type: 'integer', description: 'HTTP status code' },
                        message: { type: 'string', description: 'Error message' }
                    },
                    required: ['message']
                }
            },
            responses: {
                Error: {
                    description: 'Error response',
                    content: {
                        'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } }
                    }
                }
            }
        }
    };
}
