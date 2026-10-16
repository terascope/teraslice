import type { ParameterObject } from 'openapi3-ts/oas31';

export type Method = 'get' | 'post' | 'put' | 'delete';

/**
 * Compact description of a Teraslice route used to build the OpenAPI document.
 * `paths` are express-style (e.g. `/jobs/:jobId`); multi-path routes expand into
 * one OpenAPI path entry each. Path parameters are derived from the `:param`
 * segments, so only query parameters need to be listed explicitly.
 *
 * This file is the single source of truth for the v1 JSON API surface — adding or
 * changing an endpoint means editing the registry below, nothing in the generator.
 */
export interface RouteDef {
    methods: Method[];
    paths: string[];
    summary: string;
    tags: string[];
    query?: ParameterObject[];
    /** request body schema ref name (under components/schemas) */
    body?: string;
    /** shape of the 200 response body; defaults to a generic object */
    response?: 'object' | 'array' | 'string';
}

function q(
    name: string,
    description: string,
    schema: ParameterObject['schema'] = { type: 'string' }
): ParameterObject {
    return { name, in: 'query', description, schema };
}

const searchParams: ParameterObject[] = [
    q('size', 'Maximum number of records to return', { type: 'integer', default: 100 }),
    q('from', 'Offset to start returning records from', { type: 'integer', default: 0 }),
    q('sort', 'Field and direction to sort by, e.g. `_updated:desc`'),
    q('filter', 'Lucene query to further filter results'),
];

const deletedParam = q('deleted', 'Include soft-deleted records', {
    type: 'string', enum: ['true', 'false'], default: 'false'
});

export const routes: RouteDef[] = [
    {
        methods: ['get'], paths: ['/'], tags: ['cluster'],
        summary: 'Get cluster info (name, version, clustering type)'
    },
    {
        methods: ['get'], paths: ['/cluster/state'], tags: ['cluster'],
        summary: 'Get the current cluster state'
    },
    {
        methods: ['get'], paths: ['/cluster/connectors'], tags: ['cluster'],
        summary: 'List the configured terafoundation connectors',
        query: [
            q('type', 'Filter connectors by type'),
            q('name', 'Filter connectors by connection name'),
            q('groupBy', 'Set to `type` to group connectors by type')
        ]
    },
    {
        methods: ['get'], paths: ['/cluster/job-schema'], tags: ['cluster'],
        summary: 'Get the job schema for this cluster'
    },
    {
        methods: ['get'], paths: ['/cluster/stats'], tags: ['cluster'],
        summary: 'Get aggregate cluster analytics'
    },
    {
        methods: ['get'], paths: ['/cluster/slicers', '/cluster/controllers'], tags: ['cluster'],
        summary: 'Get statistics for all controllers', response: 'array'
    },
    {
        methods: ['post'], paths: ['/jobs'], tags: ['jobs'],
        summary: 'Submit a new job', body: 'JobConfig',
        query: [q('start', 'Set to `false` to create the job without starting it', {
            type: 'string', enum: ['true', 'false'], default: 'true'
        })]
    },
    {
        methods: ['get'], paths: ['/jobs'], tags: ['jobs'],
        summary: 'List jobs', response: 'array',
        query: [
            q('active', 'Filter by active state', { type: 'string', enum: ['true', 'false'] }),
            deletedParam,
            q('ex', 'Comma-separated execution fields to include with each job'),
            ...searchParams
        ]
    },
    {
        methods: ['get'], paths: ['/jobs/:jobId'], tags: ['jobs'],
        summary: 'Get a single job',
        query: [q('ex', 'Comma-separated execution fields to include')]
    },
    {
        methods: ['put'], paths: ['/jobs/:jobId'], tags: ['jobs'],
        summary: 'Update a job', body: 'JobConfig'
    },
    {
        methods: ['delete'], paths: ['/jobs/:jobId'], tags: ['jobs'],
        summary: 'Soft-delete a job'
    },
    {
        methods: ['get'], paths: ['/jobs/:jobId/ex'], tags: ['jobs'],
        summary: 'Get the latest execution for a job'
    },
    {
        methods: ['post'], paths: ['/jobs/:jobId/_active'], tags: ['jobs'],
        summary: 'Mark a job as active'
    },
    {
        methods: ['post'], paths: ['/jobs/:jobId/_inactive'], tags: ['jobs'],
        summary: 'Mark a job as inactive'
    },
    {
        methods: ['post'], paths: ['/jobs/:jobId/_start'], tags: ['jobs'],
        summary: 'Start a job'
    },
    {
        methods: ['post'], paths: ['/jobs/:jobId/_stop', '/ex/:exId/_stop'], tags: ['executions'],
        summary: 'Stop an execution',
        query: [
            q('timeout', 'Milliseconds to wait before force stopping', { type: 'integer' }),
            q('blocking', 'Wait for the execution to reach a terminal state', {
                type: 'string', enum: ['true', 'false'], default: 'true'
            }),
            q('force', 'Force stop the execution', {
                type: 'string', enum: ['true', 'false'], default: 'false'
            })
        ]
    },
    {
        methods: ['post'], paths: ['/jobs/:jobId/_pause', '/ex/:exId/_pause'], tags: ['executions'],
        summary: 'Pause an execution'
    },
    {
        methods: ['post'], paths: ['/jobs/:jobId/_resume', '/ex/:exId/_resume'], tags: ['executions'],
        summary: 'Resume an execution'
    },
    {
        methods: ['post'], paths: ['/jobs/:jobId/_recover', '/ex/:exId/_recover'], tags: ['executions'],
        summary: 'Recover an execution',
        query: [q('cleanup_type', 'Recovery cleanup type (errors, all)')]
    },
    {
        methods: ['post'], paths: ['/jobs/:jobId/_settings'], tags: ['jobs'],
        summary: 'Update dynamic job settings',
        query: [q('log_level', 'New log level for the execution')]
    },
    {
        methods: ['post'], paths: ['/jobs/:jobId/_workers', '/ex/:exId/_workers'], tags: ['executions'],
        summary: 'Add, remove, or set the number of workers',
        query: [
            q('add', 'Number of workers to add', { type: 'integer' }),
            q('remove', 'Number of workers to remove', { type: 'integer' }),
            q('total', 'Target total number of workers', { type: 'integer' })
        ]
    },
    {
        methods: ['get'], paths: ['/jobs/:jobId/tap', '/ex/:exId/tap'], tags: ['executions'],
        summary: 'Sample records flowing through an execution', response: 'array',
        query: [q('size', 'Number of records to sample (`all`, 0, or a positive integer)')]
    },
    {
        methods: ['get'],
        paths: [
            '/jobs/:jobId/slicer', '/jobs/:jobId/controller',
            '/ex/:exId/slicer', '/ex/:exId/controller'
        ],
        tags: ['executions'],
        summary: 'Get controller statistics for an execution', response: 'array'
    },
    {
        methods: ['get'],
        paths: ['/jobs/:jobId/errors', '/ex/:exId/errors', '/ex/errors'],
        tags: ['executions'],
        summary: 'Get recorded errors for an execution', response: 'array',
        query: searchParams
    },
    {
        methods: ['get'], paths: ['/ex'], tags: ['executions'],
        summary: 'List executions', response: 'array',
        query: [
            q('status', 'Comma-separated execution statuses to filter by'),
            deletedParam,
            ...searchParams
        ]
    },
    {
        methods: ['get'], paths: ['/ex/:exId'], tags: ['executions'],
        summary: 'Get a single execution context'
    },
    {
        methods: ['get'], paths: ['/openapi.json'], tags: ['meta'],
        summary: 'Get this OpenAPI specification'
    },
];
