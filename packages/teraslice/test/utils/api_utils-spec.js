import apiUtils from '../../lib/utils/api_utils.js';

describe('apiUtils', () => {
    it('should be able make a prometheus text format', () => {
        const stats = {
            controllers: {
                processed: 1000,
                failed: 10,
                queued: 5,
                job_duration: 10,
                workers_joined: 20,
                workers_disconnected: 30,
                workers_reconnected: 40
            }
        };
        const r = `# TYPE teraslice_slices_processed counter
teraslice_slices_processed ${stats.controllers.processed}
# TYPE teraslice_slices_failed counter
teraslice_slices_failed ${stats.controllers.failed}
# TYPE teraslice_slices_queued counter
teraslice_slices_queued ${stats.controllers.queued}
# TYPE teraslice_workers_joined counter
teraslice_workers_joined ${stats.controllers.workers_joined}
# TYPE teraslice_workers_disconnected counter
teraslice_workers_disconnected ${stats.controllers.workers_disconnected}
# TYPE teraslice_workers_reconnected counter
teraslice_workers_reconnected ${stats.controllers.workers_reconnected}
`;
        expect(apiUtils.makePrometheus(stats)).toEqual(r);
    });

    it('should be able make a prometheus text format with labels', () => {
        const stats = {
            controllers: {
                processed: 1000,
                failed: 10,
                queued: 5,
                job_duration: 10,
                workers_joined: 20,
                workers_disconnected: 30,
                workers_reconnected: 40
            }
        };
        const r = `# TYPE teraslice_slices_processed counter
teraslice_slices_processed{foo="bar"} ${stats.controllers.processed}
# TYPE teraslice_slices_failed counter
teraslice_slices_failed{foo="bar"} ${stats.controllers.failed}
# TYPE teraslice_slices_queued counter
teraslice_slices_queued{foo="bar"} ${stats.controllers.queued}
# TYPE teraslice_workers_joined counter
teraslice_workers_joined{foo="bar"} ${stats.controllers.workers_joined}
# TYPE teraslice_workers_disconnected counter
teraslice_workers_disconnected{foo="bar"} ${stats.controllers.workers_disconnected}
# TYPE teraslice_workers_reconnected counter
teraslice_workers_reconnected{foo="bar"} ${stats.controllers.workers_reconnected}
`;
        expect(apiUtils.makePrometheus(stats, { foo: 'bar' })).toEqual(r);
    });

    it('should be able to detect if a request is prometheus', () => {
        expect(apiUtils.isPrometheusRequest({
            headers: {
                accept: 'blah application/openmetrics-text; blah blah'
            }
        })).toBeTrue();
    });
});
