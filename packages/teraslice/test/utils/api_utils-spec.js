'use strict';

const api_utils = require('../../lib/utils/api_utils');

describe('api_utils', () => {
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
        const r = `# HELP teraslice_processed
# TYPE teraslice_processed counter
1000
# HELP teraslice_failed
# TYPE teraslice_failed counter
10
# HELP teraslice_queued
# TYPE teraslice_queued counter
5
# HELP teraslice_job_duration
# TYPE teraslice_job_duration counter
10
# HELP teraslice_workers_joined
# TYPE teraslice_workers_joined counter
20
# HELP teraslice_workers_disconnected
# TYPE teraslice_workers_disconnected counter
30
# HELP teraslice_workers_reconnected
# TYPE teraslice_workers_reconnected counter
40
`;
        expect(api_utils.makePrometheus(stats)).toEqual(r);
    });
});
