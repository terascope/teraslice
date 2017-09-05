'use strict';

var _ = require('lodash');
var Promise = require('bluebird');
var misc = require('./misc')();

// We need long timeouts for some of these jobs
jasmine.DEFAULT_TIMEOUT_INTERVAL = 600000;

if (process.stdout.isTTY) {
    var SpecReporter = require('jasmine-spec-reporter').SpecReporter;
    jasmine.getEnv().clearReporters();
    jasmine.getEnv().addReporter(new SpecReporter({
        spec: {
            displayStacktrace: true,
            displayDuration: true
        }
    }))
}

describe('teraslice', function() {

    function dockerUp() {
        console.log(' - Bringing Docker environment up');
        return misc.compose.up({build: ''})
    }

    function waitForES() {
        process.stdout.write(' - Waiting for Elasticsearch...');
        return new Promise(function(resolve, reject) {
            var attempts = 0;

            function wait() {
                attempts++;
                misc.es().cat.indices({
                    requestTimeout: 1000
                })
                    .then(function() {
                        console.log(' Ready');
                        resolve()
                    })
                    .catch(function(err) {
                        if (attempts > 50) {
                            console.log(' Giving up');
                            reject('timed out')
                        }
                        else {
                            process.stdout.write('.');
                            setTimeout(wait, 1000)
                        }
                    })
            }

            wait()
        })
    }

    function waitForTeraslice() {
        process.stdout.write(' - Waiting for Teraslice...');
        return new Promise(function(resolve, reject) {
            var attempts = 0;
            var check = misc.teraslice().cluster.state;

            function wait() {
                attempts++;
                check()
                    .then(function() {
                        console.log(' Ready');
                        resolve()
                    })
                    .catch(function(err) {
                        if (attempts > 50) {
                            console.log(' Giving up');
                            reject('timed out')
                        }
                        else {
                            process.stdout.write('.');
                            setTimeout(wait, 1000)
                        }
                    })
            }

            wait()
        })
    }

    function cleanup() {
        console.log(' - Cleaning up teraslice state & prior test results');
        var deletions = [
            misc.es().indices.delete({index: 'teracluster__*', ignore: [404]}),
            misc.es().indices.delete({index: 'test-*', ignore: [404]})
        ];
        return Promise.all(deletions)
    }

    function generateTestData() {
        console.log(' - Making sure example data generated');

        function generate(count, hex) {
            var indexName = 'example-logs-' + count;
            if (hex) {
                indexName += '-hex'
            }
            var job_spec = {
                'name': 'Generate: ' + indexName,
                'lifecycle': 'once',
                'workers': 1,
                'operations': [
                    {
                        '_op': 'elasticsearch_data_generator',
                        'size': count
                    },
                    {
                        '_op': 'elasticsearch_index_selector',
                        'index': indexName,
                        'type': 'events'
                    },
                    {
                        '_op': 'elasticsearch_bulk',
                        'size': 5000
                    }
                ]
            };
            return new Promise(function(resolve, reject) {
                misc.es().indices.stats({index: indexName}, function(err, stats) {
                    if (_.get(stats, '_all.total.docs.count') === count) {
                        resolve();
                        return
                    }
                    console.warn('    - defining index:', indexName, ', reason:', _.get(stats, '_all.total.docs.count', 'index_not_found'));
                    misc.es().indices.delete({index: indexName}, function() {
                        if (!hex) {
                            resolve(misc.teraslice().jobs.submit(job_spec))
                        }
                        else {
                            job_spec.operations[0].size = count / hex.length;
                            job_spec.operations[0].set_id = 'hexadecimal';
                            job_spec.operations[1].id_field = 'id';
                            resolve(_.map(hex, function(letter) {
                                job_spec.name = `Generate: ${indexName}[${letter}]`;
                                job_spec.operations[0].id_start_key = letter;
                                return misc.teraslice().jobs.submit(job_spec)
                            }))
                        }
                    })
                })
            })
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
            .catch(function(err) {
                console.error('Data generation failed: ', err);
                process.exit(1)
            })
    }

    var before = [dockerUp, waitForES, waitForTeraslice, cleanup, generateTestData]

    beforeAll(function(done) {
        Promise.resolve(before)
            .mapSeries(f => f())
            .then(function() {
                console.log('Global setup complete. Starting tests...');
                done()
            })
            .catch(function(err) {
                console.error('Setup failed: ', err, ' - `docker-compose logs` may provide clues');
                process.exit(2)
            })
    });
    
    require('./cases/cluster/job-state')();

    /*require('./cases/data/id-reader')();
    require('./cases/data/elasticsearch-bulk')();
    require('./cases/data/reindex')();
    require('./cases/cluster/worker-allocation')();
    require('./cases/cluster/state')();
    require('./cases/validation/job')();*/
});
