'use strict';

const ms = require('ms');
const _ = require('lodash');
const Promise = require('bluebird');
const uuid = require('uuid/v4');
const signale = require('./signale');
const { waitForClusterState, waitForJobStatus } = require('./wait');
const setupTerasliceConfig = require('./setup-config');
const downloadAssets = require('./download-assets');
const { resetState } = require('./helpers');
const misc = require('./misc');

const jobList = [];

const { GENERATE_ONLY } = process.env;
const generateOnly = GENERATE_ONLY ? parseInt(GENERATE_ONLY, 100) : null;

function getElapsed(time) {
    const elapsed = Date.now() - time;
    return `took ${ms(elapsed)}`;
}

async function dockerUp() {
    const startTime = Date.now();
    signale.pending('Bringing Docker environment up...');

    await misc.compose.up({
        'force-recreate': ''
    });
    signale.success('Docker environment is good to go', getElapsed(startTime));
}

function waitForTeraslice() {
    const startTime = Date.now();
    signale.pending('Waiting for Teraslice...');

    return waitForClusterState().then((nodes) => {
        signale.success(`Teraslice is ready to go with ${nodes} nodes`, getElapsed(startTime));
    });
}

async function generateTestData() {
    const startTime = Date.now();
    signale.pending('Generating example data...');

    function populateStateForRecoveryTests(textExId, indexName) {
        if (generateOnly) return Promise.resolve();

        const exId = jobList.shift();
        if (!exId) return Promise.resolve();

        const recoveryStartTime = Date.now();
        signale.info(`Populating recovery state for exId: ${textExId}`);

        const client = misc.es();
        return misc
            .teraslice()
            .cluster.get(`/ex/${exId}`)
            .then((exConfig) => {
                exConfig.ex_id = textExId;
                const date = new Date();
                const iso = date.toISOString();
                const index = `${misc.CLUSTER_NAME}__state-${iso
                    .split('-')
                    .slice(0, 2)
                    .join('.')}`;
                const time = date.getTime();
                const pastDate = new Date(time - 600000);

                exConfig.operations[1].index = indexName;
                exConfig._status = 'failed';
                exConfig._created = pastDate;
                exConfig._updated = pastDate;

                const errored = {
                    _created: iso,
                    _updated: iso,
                    slice_id: uuid(),
                    slicer_order: 1,
                    slicer_id: 0,
                    request: 100,
                    state: 'error',
                    ex_id: textExId
                };

                const notCompleted = {
                    _created: iso,
                    _updated: iso,
                    slice_id: uuid(),
                    slicer_order: 2,
                    slicer_id: 0,
                    request: 100,
                    state: 'start',
                    ex_id: textExId
                };

                return Promise.all([
                    client.index({
                        index,
                        type: 'state',
                        id: errored.slice_id,
                        body: errored
                    }),
                    client.index({
                        index,
                        type: 'state',
                        id: notCompleted.slice_id,
                        body: notCompleted
                    }),
                    client.index({
                        index: `${misc.CLUSTER_NAME}__ex`,
                        type: 'ex',
                        id: exConfig.ex_id,
                        body: exConfig
                    })
                ]);
            })
            .then(() => {
                signale.info(
                    `Populated recovery state for exId: ${textExId}`,
                    getElapsed(recoveryStartTime)
                );
            });
    }

    function postJob(jobSpec) {
        return misc
            .teraslice()
            .jobs.submit(jobSpec)
            .then((job) => job.exId().then((exId) => {
                jobList.push(exId);
                return job;
            }));
    }

    async function generate(count, hex) {
        if (generateOnly && generateOnly !== count) return;

        const genStartTime = Date.now();
        let indexName = misc.getExampleIndex(count);
        if (hex) {
            indexName += '-hex';
        }

        signale.info(`Generating ${indexName} example data`);
        const jobSpec = {
            name: `Generate: ${indexName}`,
            lifecycle: 'once',
            workers: 1,
            assets: ['elasticsearch'],
            operations: [
                {
                    _op: 'elasticsearch_data_generator',
                    size: count
                },
                {
                    _op: 'elasticsearch_index_selector',
                    index: indexName,
                    type: 'events'
                },
                {
                    _op: 'elasticsearch_bulk',
                    size: 1000
                }
            ]
        };

        try {
            if (hex) {
                jobSpec.operations[0].size = count / hex.length;
                jobSpec.operations[0].set_id = 'hexadecimal';
                jobSpec.operations[1].id_field = 'id';
                const result = await Promise.map(hex, (letter) => {
                    jobSpec.name = `Generate: ${indexName}[${letter}]`;
                    jobSpec.operations[0].id_start_key = letter;
                    return postJob(jobSpec);
                });
                const jobs = _.castArray(result);
                await Promise.map(jobs, (job) => waitForJobStatus(job, 'completed'));
            } else {
                await postJob(jobSpec);
            }

            signale.info(`Generated ${indexName} example data`, getElapsed(genStartTime));
        } catch (err) {
            signale.error(`Failure to generate example data ${indexName}`, err);
            throw err;
        }
    }

    try {
        await Promise.all(misc.EXAMLPE_INDEX_SIZES.map((size) => generate(size)));
        // we need fully active jobs so we can get proper meta data for recovery state tests
        await Promise.all([
            populateStateForRecoveryTests('testex-errors', 'test-recovery-100'),
            populateStateForRecoveryTests('testex-all', 'test-recovery-200')
        ]);
        signale.success('Data generation is done', getElapsed(startTime));
    } catch (err) {
        signale.error('Data generation failed', getElapsed(startTime));
        throw err;
    }
}

module.exports = async () => {
    await misc.globalTeardown(false);
    await misc.resetLogs();

    signale.time('global setup');

    await Promise.all([setupTerasliceConfig(), downloadAssets()]);

    await dockerUp();
    await waitForTeraslice();
    await Promise.delay(2000);
    await resetState();

    try {
        await generateTestData();
    } catch (err) {
        signale.error('Setup failed, `docker-compose logs` may provide clues');
        signale.error(err);
        process.exit(1);
    }

    signale.timeEnd('global setup');
};
