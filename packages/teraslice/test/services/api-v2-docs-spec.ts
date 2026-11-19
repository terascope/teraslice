import 'jest-extended';
import { z } from 'zod';
import { TerasliceApiV2 } from '@terascope/types';
import { generateV2DocTables } from '../../src/lib/cluster/services/api/v2/docs-tables.js';
import { createRouteRegistry } from '../../src/lib/utils/v2_routes.js';

describe('v2 API doc tables', () => {
    const tables = generateV2DocTables();

    it('should have a route table per tag, in registration order', () => {
        const routes = tables['V2 ROUTES'];

        expect(routes.match(/^### .+$/gm)).toEqual(['### Cluster', '### Jobs', '### Executions']);
        expect(routes).toContain('| GET | `/v2` | | Get cluster and version information |');
        expect(routes).toContain('| POST | `/v2/jobs` | `start`, job config body | Submit a job, and start it unless `start` is `false` |');
        expect(routes).toContain('| POST | `/v2/jobs/{jobId}/_stop` | `timeout`, `blocking`, `force` | Stop a job |');
    });

    it('should have a table for every query and response schema', () => {
        expect(Object.keys(tables)).toIncludeAllMembers([
            'V2 SCHEMA StopJobQuery',
            'V2 SCHEMA GetJobsQuery',
            'V2 SCHEMA StopJobResult',
            'V2 SCHEMA ClusterState',
            'V2 SCHEMA SliceErrorList',
        ]);
    });

    it('should read the tap size default from zod', () => {
        expect(tables['V2 SCHEMA GetJobTapQuery']).toContain('| `size` | `"all"` \\| integer | `10` |');
    });

    it('should show query param types as parsed', () => {
        expect(tables['V2 SCHEMA GetJobsQuery']).toContain('| `deleted` | boolean | `false` |');
        expect(tables['V2 SCHEMA GetJobsQuery']).toContain('| `size` | integer | `100` |');
    });

    it('should mark required query params', () => {
        expect(tables['V2 SCHEMA UpdateJobSettingsQuery']).toContain('| `log_level` | `"trace"` \\| `"debug"` \\| `"info"` \\| `"warn"` \\| `"error"` \\| `"fatal"` | required |');
    });

    it('should list every route that uses a schema', () => {
        expect(tables['V2 SCHEMA SliceErrorList']).toStartWith(
            'Used by `GET /v2/jobs/{jobId}/errors` and `GET /v2/ex/{exId}/errors`.'
        );
    });

    it('should list the item fields of an array response', () => {
        const table = tables['V2 SCHEMA SliceErrorList'];

        expect(table).toContain('An array of `SliceStateRecord`.');
        expect(table).toContain('| `slicer_id` | number | The slicer that created the slice |');
    });

    it('should list the value fields of a record response', () => {
        const table = tables['V2 SCHEMA ClusterState'];

        expect(table).toContain('Each value is `NodeState`.');
        expect(table).toContain('| `active` | `ProcessNode`[] | |');
    });

    it('should name nested schemas instead of flattening them', () => {
        expect(tables['V2 SCHEMA JobRecord']).toContain('| `operations` | `OpConfig`[] | |');
    });

    it('should note loose schemas', () => {
        expect(tables['V2 SCHEMA JobRecord']).toContain('Can have fields not listed here.');
        expect(tables['V2 SCHEMA StopJobResult']).not.toContain('Can have fields not listed here.');
    });

    it('should escape MDX braces outside code spans', () => {
        const table = tables['V2 SCHEMA ExecutionRecord'];

        expect(table).toContain('saved when the execution stops; \\{\\} until then');
        expect(tables['V2 SCHEMA JobWithExecution']).toContain('`{}` when the job has no execution');
    });

    it('should throw if a route schema is not exported from TerasliceApiV2', () => {
        const registry = createRouteRegistry();
        registry.get('/hello', {
            operationId: 'hello',
            summary: 'Hello',
            tags: ['Cluster'],
            query: z.strictObject({ name: z.string() }),
            response: TerasliceApiV2.ClusterInfoSchema,
        }, () => ({}) as any);

        expect(() => generateV2DocTables(registry.routes)).toThrow(
            'Every v2 route schema must be exported from TerasliceApiV2'
        );
    });
});
