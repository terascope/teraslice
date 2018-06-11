'use strict';

/* eslint-disable no-signale */

const _ = require('lodash');
const signale = require('signale');
const path = require('path');
const Promise = require('bluebird');
const execFile = Promise.promisify(require('child_process').execFile);
const { forNodes } = require('./wait');
const misc = require('./misc');

// require jasmine-expect for more friendly expecations
require('jasmine-expect');

// We need long timeouts for some of these jobs
jasmine.DEFAULT_TIMEOUT_INTERVAL = 6 * 60 * 1000;

if (process.stdout.isTTY) {
    const { SpecReporter } = require('jasmine-spec-reporter');
    jasmine.getEnv().clearReporters();
    jasmine.getEnv().addReporter(new SpecReporter({
        spec: {
            displayStacktrace: true,
            displayDuration: true
        }
    }));
}

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

        return new Promise(((resolve) => {
            misc.es().indices.delete({ index: indexName }, () => {
                if (!hex) {
                    resolve(misc.teraslice().jobs.submit(jobSpec));
                } else {
                    jobSpec.operations[0].size = count / hex.length;
                    jobSpec.operations[0].set_id = 'hexadecimal';
                    jobSpec.operations[1].id_field = 'id';
                    resolve(_.map(hex, (letter) => {
                        jobSpec.name = `Generate: ${indexName}[${letter}]`;
                        jobSpec.operations[0].id_start_key = letter;
                        return misc.teraslice().jobs.submit(jobSpec);
                    }));
                }
            });
        }));
    }

    return Promise.all([
        generate(10),
        generate(1000),
        generate(10000),
        generate(10000, ['d', '3'])
    ])
        .then(_.filter)
        .then(_.flatten)
        .map(job => job.waitForStatus('completed'))
        .then(() => {
            signale.success('Data generation is done');
        })
        .catch(err => Promise.reject(new Error('Data generation failed: ', err)));
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
            signale.error(new Error('Setup failed: ', err, '- `docker-compose logs` may provide clues'));
            return misc.compose.kill().finally(() => {
                process.exit(1);
            });
        });
});

afterAll(() => misc.compose.stop());
