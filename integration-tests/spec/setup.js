'use strict';

/* eslint-disable no-console */

const _ = require('lodash');
const Promise = require('bluebird');
const misc = require('./misc')();

// We need long timeouts for some of these jobs
jasmine.DEFAULT_TIMEOUT_INTERVAL = 60 * 1000;

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

describe('teraslice', () => {
    function dockerUp() {
        process.stdout.write(' - Bringing Docker environment up...');
        const intervalId = setInterval(() => {
            process.stdout.write('.');
        }, 10 * 1000);
        return misc.compose.up({ build: '' }).then((result) => {
            clearInterval(intervalId);
            console.log(' Ready');
            return result;
        }, (err) => {
            clearInterval(intervalId);
            console.log(' Failed');
            return err;
        });
    }

    // ensure docker-compose stack is down before starting it
    function dockerDown() {
        console.log(' - Ensuring docker environment is in a clean slate');
        return misc.compose.down({ 'remove-orphans': '' }).catch(() => Promise.resolve());
    }

    function waitForES() {
        process.stdout.write(' - Waiting for Elasticsearch...');
        return new Promise(((resolve, reject) => {
            let attempts = 0;

            function wait() {
                attempts += 1;
                misc.es().cat.indices({
                    requestTimeout: 1000
                })
                    .then(() => {
                        console.log(' Ready');
                        resolve();
                    })
                    .catch(() => {
                        if (attempts > 50) {
                            console.log(' Giving up');
                            reject('timed out');
                        } else {
                            process.stdout.write('.');
                            setTimeout(wait, 1000);
                        }
                    });
            }

            wait();
        }));
    }

    function waitForTeraslice() {
        process.stdout.write(' - Waiting for Teraslice...');
        return new Promise(((resolve, reject) => {
            let attempts = 0;

            function wait() {
                attempts += 1;
                misc.teraslice().cluster.txt('assets')
                    .then(() => {
                        console.log(' Ready');
                        resolve();
                    })
                    .catch(() => {
                        if (attempts > 50) {
                            console.log(' Giving up');
                            reject('timed out');
                        } else {
                            process.stdout.write('.');
                            setTimeout(wait, 1000);
                        }
                    });
            }

            wait();
        }));
    }

    function cleanup() {
        console.log(' - Cleaning up teraslice state & prior test results');
        return misc.es().indices.delete({ index: 'test-*', ignore: [404] });
    }

    function generateTestData() {
        console.log(' - Making sure example data generated');

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
                        size: 5000
                    }
                ]
            };
            return new Promise(((resolve) => {
                misc.es().indices.stats({ index: indexName }, (err, stats) => {
                    if (_.get(stats, '_all.total.docs.count') === count) {
                        resolve();
                        return;
                    }
                    console.warn('    - defining index:', indexName, ', reason:', _.get(stats, '_all.total.docs.count', 'index_not_found'));
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
            .catch((err) => {
                console.error('Data generation failed: ', err);
                process.exit(1);
            });
    }

    const before = [dockerDown, dockerUp, waitForES, cleanup, waitForTeraslice, generateTestData];

    beforeAll((done) => {
        Promise.resolve(before)
            .mapSeries(f => f())
            .then(() => {
                console.log('Global setup complete. Starting tests...');
                done();
            })
            .catch((err) => {
                console.error('Setup failed: ', err, ' - `docker-compose logs` may provide clues');
                process.exit(2);
            });
    }, 3 * 60 * 1000);

    require('./cases/cluster/api')();
    require('./cases/assets/simple')();
    require('./cases/cluster/job-state')();
    require('./cases/data/id-reader')();
    require('./cases/data/elasticsearch-bulk')();
    require('./cases/data/reindex')();
    require('./cases/cluster/worker-allocation')();
    require('./cases/cluster/state')();
    require('./cases/validation/job')();
});
