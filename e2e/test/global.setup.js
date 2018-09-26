'use strict';

const _ = require('lodash');
const signale = require('signale');
const Promise = require('bluebird');
const uuid = require('uuid/v4');
const { waitForClusterState, waitForJobStatus } = require('./wait');
const misc = require('./misc');

const jobList = [];

function getElapsed(time) {
    const elapsed = Date.now() - time;
    if (elapsed < 1000) {
        return `took ${elapsed}ms`;
    }
    return `took ${_.round(elapsed / 1000, 2)}s`;
}

function dockerBuild() {
    const startTime = Date.now();
    signale.pending('Building Docker environment...');

    return misc.compose
        .build()
        .then(() => {
            signale.success('Docker environment is built', getElapsed(startTime));
        });
}

function dockerUp() {
    const startTime = Date.now();
    signale.pending('Bringing Docker environment up...');

    return misc.compose
        .up({
            'force-recreate': ''
        })
        .then(() => {
            signale.success('Docker environment is good to go', getElapsed(startTime));
        });
}

// ensure docker-compose stack is down before starting it
function dockerDown() {
    const startTime = Date.now();
    signale.pending('Ensuring docker environment is in a clean slate...');

    return misc.compose.down({
        'remove-orphans': '',
        volumes: ''
    }).then(() => {
        signale.success('Docker environment is clean', getElapsed(startTime));
    }).catch(() => {
        signale.success('Docker environment should be clean', getElapsed(startTime));
    });
}

function waitForTeraslice() {
    const startTime = Date.now();
    signale.pending('Waiting for Teraslice...');

    return waitForClusterState()
        .then((nodes) => {
            signale.success(`Teraslice is ready to go with ${nodes} nodes`, getElapsed(startTime));
        });
}

function generateTestData() {
    const startTime = Date.now();
    signale.pending('Generating example data...');

    function populateStateForRecoveryTests(textExId, indexName) {
        const recoveryStartTime = Date.now();
        signale.info(`Populating recovery state for exId: ${textExId}`);
        const exId = jobList.shift();
        if (!exId) return Promise.resolve(true);
        const client = misc.es();
        return misc.teraslice().cluster.get(`/ex/${exId}`)
            .then((exConfig) => {
                exConfig.ex_id = textExId;
                const date = new Date();
                const iso = date.toISOString();
                const index = `teracluster__state-${iso.split('-').slice(0, 2).join('.')}`;
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
                        index, type: 'state', id: errored.slice_id, body: errored
                    }),
                    client.index({
                        index, type: 'state', id: notCompleted.slice_id, body: notCompleted
                    }),
                    client.index({
                        index: 'teracluster__ex', type: 'ex', id: exConfig.ex_id, body: exConfig
                    })
                ]);
            }).then(() => {
                signale.info(`Populated recovery state for exId: ${textExId}`, getElapsed(recoveryStartTime));
            });
    }

    function postJob(jobSpec) {
        return misc.teraslice().jobs.submit(jobSpec)
            .then(job => job.exId()
                .then((exId) => {
                    jobList.push(exId);
                    return job;
                }));
    }

    function generate(count, hex) {
        const genStartTime = Date.now();
        let indexName = `example-logs-${count}`;
        if (hex) {
            indexName += '-hex';
        }
        signale.info(`Generating ${indexName} example data`);
        const jobSpec = {
            name: `Generate: ${indexName}`,
            lifecycle: 'once',
            workers: 1,
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
                    size: 10000
                }
            ]
        };

        return Promise.resolve()
            .then(() => misc.cleanupIndex(indexName))
            .then(() => {
                if (!hex) return postJob(jobSpec);
                jobSpec.operations[0].size = count / hex.length;
                jobSpec.operations[0].set_id = 'hexadecimal';
                jobSpec.operations[1].id_field = 'id';
                return Promise.map(hex, (letter) => {
                    jobSpec.name = `Generate: ${indexName}[${letter}]`;
                    jobSpec.operations[0].id_start_key = letter;
                    return postJob(jobSpec);
                });
            })
            .then(result => _.castArray(result))
            .then(jobs => Promise.map(jobs, job => waitForJobStatus(job, 'completed')))
            .then(() => {
                signale.info(`Generated ${indexName} example data`, getElapsed(genStartTime));
            })
            .catch((err) => {
                signale.error(`Failure to generate example data ${indexName}`, err);
                return Promise.reject(err);
            });
    }

    return Promise.all([
        generate(10),
        generate(1000),
        generate(10000),
        generate(10000, ['d', '3'])
    ])
        // we need fully active jobs so we can get proper meta data for recovery state tests
        .then(() => Promise.all([
            populateStateForRecoveryTests('testex-errors', 'test-recovery-100'),
            populateStateForRecoveryTests('testex-all', 'test-recovery-200')
        ]))
        .then(() => {
            signale.success('Data generation is done', getElapsed(startTime));
        })
        .catch((err) => {
            signale.error('Data generation failed', getElapsed(startTime));
            return Promise.reject(err);
        });
}

module.exports = async () => {
    process.stdout.write('\n');
    signale.time('global setup');
    await dockerDown();
    await dockerBuild();
    await dockerUp();
    await waitForTeraslice();

    try {
        await generateTestData();
    } catch (err) {
        signale.error('Setup failed, `docker-compose logs` may provide clues');
        signale.error(err);
        process.exit(1);
    }

    signale.timeEnd('global setup');
};
