'use strict';

process.env.BLUEBIRD_LONG_STACK_TRACES = '1';

const _ = require('lodash');
const signale = require('signale');
const path = require('path');
const Promise = require('bluebird');
const uuid = require('uuid');
const { SpecReporter } = require('jasmine-spec-reporter');
const execFile = Promise.promisify(require('child_process').execFile);
const { forNodes } = require('./wait');
const misc = require('./misc');

const jobList = [];
// require jasmine-expect for more friendly expecations
require('jasmine-expect');

// We need long timeouts for some of these jobs
jasmine.DEFAULT_TIMEOUT_INTERVAL = 6 * 60 * 1000;

jasmine.getEnv().clearReporters();
jasmine.getEnv().addReporter(new SpecReporter({
    spec: {
        displayStacktrace: true,
        displayDuration: true
    }
}));

function generatingDockerFile() {
    signale.pending('Generating docker-compose file...');
    const fileName = path.join(__dirname, '..', 'docker-compose.sh');
    return execFile(fileName, { cwd: path.join(__dirname, '..') }).then(() => {
        signale.success('Generated docker-compose file');
    });
}

function dockerUp() {
    signale.pending('Bringing Docker environment up...');

    const options = {
        build: '',
        timeout: 1,
    };
    return misc.compose.up(options).then((result) => {
        signale.success('Docker environment is good to go');
        return result;
    });
}

// ensure docker-compose stack is down before starting it
function dockerDown() {
    signale.pending('Ensuring docker environment is in a clean slate...');

    return misc.compose.down({
        timeout: 1
    }).then(() => {
        signale.success('Docker environment is clean');
    }).catch(() => {
        signale.success('Docker environment should be clean');
    });
}

function waitForTerasliceNodes() {
    signale.pending('Waiting for Teraslice...');

    return forNodes(4).then(() => {
        signale.success('Teraslice is ready');
    });
}

function generateTestData() {
    signale.pending('Generating example data...');

    function populateStateForRecoveryTests() {
        const exId = jobList.shift();
        if (!exId) return Promise.resolve(true);
        const client = misc.es();
        return misc.teraslice().cluster.get(`/ex/${exId}`)
            .then((exConfig) => {
                exConfig.ex_id = 'testex';
                const date = new Date();
                const iso = date.toISOString();
                const index = `teracluster__state-${iso.split('-').slice(0, 2).join('.')}`;
                const time = date.getTime();
                const pastDate = new Date(time - 600000);

                exConfig.operations[1].index = 'test-recovery-300';
                exConfig._status = 'failed';
                exConfig._created = pastDate;
                exConfig._created = pastDate;

                const errored = {
                    _created: iso,
                    _updated: iso,
                    slice_id: uuid(),
                    slicer_order: 1,
                    slicer_id: 0,
                    request: 100,
                    state: 'error',
                    ex_id: 'testex'
                };

                const notCompleted = {
                    _created: iso,
                    _updated: iso,
                    slice_id: uuid(),
                    slicer_order: 1,
                    slicer_id: 0,
                    request: 100,
                    state: 'start',
                    ex_id: 'testex'
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
                ])
                    .catch(err => Promise.reject(err));
            });
    }

    function postJob(jobSpec) {
        return misc.teraslice().jobs.submit(jobSpec)
            .then(job => job.ex()
                .then((exId) => {
                    jobList.push(exId);
                    return job;
                }));
    }

    function cleanupIndex(indexName) {
        return misc.es().indices.delete({ index: indexName })
            .then(() => true)
            .catch(() => Promise.resolve(true));
    }

    function generate(count, hex) {
        let indexName = `example-logs-${count}`;
        if (hex) {
            indexName += '-hex';
        }
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
            .then(() => cleanupIndex(indexName))
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
            });
    }

    return Promise.all([
        generate(10),
        generate(1000),
        generate(10000),
        generate(10000, ['d', '3'])
    ])
        .then(_.filter)
        .then(_.flatten)
        .then((jobs) => {
            const generatedJobs = jobs.map(job => job.waitForStatus('completed', 100));
            // we need fully active jobs so we can get proper meta data for recovery state tests
            generatedJobs.push(populateStateForRecoveryTests());
            return Promise.all(generatedJobs);
        })
        .then(() => {
            signale.success('Data generation is done');
        })
        .catch((err) => {
            signale.error('Data generation failed');
            return Promise.reject(err);
        });
}

beforeAll((done) => {
    signale.time('global setup');
    generatingDockerFile()
        .then(() => dockerDown())
        .then(() => dockerUp())
        .then(() => waitForTerasliceNodes())
        .then(() => generateTestData())
        .then(() => {
            signale.timeEnd('global setup');
            done();
        })
        .catch((err) => {
            signale.error('Setup failed, `docker-compose logs` may provide clues');
            signale.error(err.stack);

            return misc.compose.kill().finally(() => {
                process.exit(1);
            });
        });
});

afterAll(() => misc.compose.stop());
