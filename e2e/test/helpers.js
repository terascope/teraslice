'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const misc = require('./misc');
const wait = require('./wait');

async function resetState() {
    const client = misc.teraslice();
    const state = await client.cluster.state();
    const cleanupJobs = [];
    _.forEach(state, (node) => {
        const { assignment, job_id: jobId } = node;

        const isWorker = ['execution_controller', 'worker'].includes(assignment);
        if (isWorker) {
            cleanupJobs.push(jobId);
        }
    });

    await Promise.map(_.uniq(cleanupJobs), async (jobId) => {
        try {
            await client.jobs.wrap(jobId).stop({ blocking: true });
        } catch (err) {
            // ignore error;
        }
    });

    const count = _.keys(state).length;
    if (count !== misc.DEFAULT_NODES) {
        await misc.scaleWorkers();
        await wait.forWorkers();
    }
}

module.exports = {
    resetState,
};
