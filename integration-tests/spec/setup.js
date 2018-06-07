'use strict';

/* eslint-disable no-console */

const _ = require('lodash');
const Promise = require('bluebird');
const { forNodes } = require('./wait')();
const misc = require('./misc')();

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

describe('teraslice', () => {
    function dockerUp() {
        console.time(' [benchmark] docker-compose up');
        console.log(' - Bringing Docker environment up...');

        const options = {
            build: '',
            timeout: 1,
        };
        if (process.env.MODE === 'qa') {
            options['no-recreate'] = '';
        } else {
            options['renew-anon-volumes'] = '';
        }

        return misc.compose.up(options).then((result) => {
            console.timeEnd(' [benchmark] docker-compose up');
            return result;
        });
    }

    // ensure docker-compose stack is down before starting it
    function dockerDown() {
        console.time(' [benchmark] docker-compose down');
        console.log(' - Ensuring docker environment is in a clean slate...');

        return misc.compose.down({
            timeout: 1,
            volumes: ''
        }).then(() => {
            console.timeEnd(' [benchmark] docker-compose down');
        }).catch(() => {
            console.timeEnd(' [benchmark] docker-compose down');
        });
    }

    function waitForES() {
        console.time(' [benchmark] waiting for elasticsearch');
        console.log(' - Waiting for Elasticsearch...');

        return new Promise(((resolve, reject) => {
            let attempts = 0;

            function wait() {
                attempts += 1;
                misc.es().cat.indices({
                    health: 'green',
                    requestTimeout: 1000
                }).then(() => {
                    console.timeEnd(' [benchmark] waiting for elasticsearch');
                    resolve();
                }).catch(() => {
                    if (attempts > 50) {
                        console.log(' Giving up');
                        reject('timed out');
                    } else {
                        setTimeout(wait, 1000);
                    }
                });
            }

            wait();
        }));
    }

    function waitForTeraslice() {
        console.time(' [benchmark] waiting for teraslice');
        console.log(' - Waiting for Teraslice...');

        return forNodes(4).then(() => {
            console.timeEnd(' [benchmark] waiting for teraslice');
        });
    }

    function cleanup() {
        console.time(' [benchmark] cleanup');
        console.log(' - Cleaning up teraslice state & prior test results');

        return misc.es().indices.delete({ index: 'test-*', ignore: [404] }).then(() => {
            console.timeEnd(' [benchmark] cleanup');
        });
    }

    function generateTestData() {
        console.time(' [benchmark] generate test data');
        console.log(' - Generating example data');

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

                    console.warn(`    - defining index: ${indexName}, reason:`, _.get(stats, '_all.total.docs.count', 'index_not_found'));

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
            .then(() => {
                console.timeEnd(' [benchmark] generate test data');
            })
            .catch((err) => {
                console.error('Data generation failed: ', err);
                process.exit(1);
            });
    }

    beforeAll((done) => {
        console.log('- Global setup complete. Starting tests...');
        console.time(' [benchmark] global setup');
        Promise.resolve()
            .then(() => dockerDown())
            .then(() => dockerUp())
            .then(() => waitForES())
            .then(() => waitForTeraslice())
            .then(() => cleanup())
            .then(() => generateTestData())
            .then(() => {
                console.timeEnd(' [benchmark] global setup');
                done();
            })
            .catch((err) => {
                console.error('Setup failed: ', err, ' - `docker-compose logs` may provide clues');
                misc.compose.kill().finally(() => {
                    process.exit(2);
                });
            });
    });

    afterAll(() => misc.compose.stop());

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
