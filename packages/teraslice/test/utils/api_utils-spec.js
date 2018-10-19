'use strict';

const apiUtils = require('../../lib/utils/api_utils');

describe('apiUtils', () => {
    it('makePrometheus', () => {
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
${stats.controllers.processed}
# TYPE teraslice_slices_failed counter
${stats.controllers.failed}
# TYPE teraslice_slices_queued counter
${stats.controllers.queued}
# TYPE teraslice_workers_joined counter
${stats.controllers.workers_joined}
# TYPE teraslice_workers_disconnected counter
${stats.controllers.workers_disconnected}
# TYPE teraslice_workers_reconnected counter
${stats.controllers.workers_reconnected}
`;
        expect(apiUtils.makePrometheus(stats)).toEqual(r);
    });
});
