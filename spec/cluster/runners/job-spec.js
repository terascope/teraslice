var Promise = require('bluebird');
var fs = require('fs');

var global_context = {
    sysconfig: {
        terafoundation: {
            log_path: 'subPath'
        },
        teraslice: {
            cluster: {
                name: "testcluster"
            }
        }
    },
    foundation: {
        getConnection: function() {
            return {
                client: {
                    indices: {
                        create: function() {
                            return Promise.resolve({})
                        }
                    }
                }
            }
        },
        makeLogger: function() {
        },
        startWorkers: function() {
        }
    },
    cluster: {isMaster: true},
    startWorkers: function() {
    },
    makeLogger: function() {
    },
    elasticsearch: {default: {}}
};


describe('job_runner', function() {

    var job_runner = require('../../../lib/cluster/runners/job')(global_context);

    var internal = job_runner.__test_context();


    var job = JSON.stringify({
        "name": "Data Generator",
        "lifecycle": "once",
        "analytics": false,
        "operations": [
            {
                "_op": "elasticsearch_data_generator",
                "size": 5000,
                "file_path": "/Users/Projects/data.js"
            },
            {
                "_op": "elasticsearch_index_selector",
                "index": "bigdata5",
                "type": "events"
            },
            {
                "_op": "elasticsearch_bulk",
                "size": 5000
            }
        ]
    });

    //used for get job
    process.env.job = job;

    afterAll(function() {

        //remove enviroment variable
        delete process.env.job;

    });

    it('job_runner.initialize returns defaults and functions to start the job', function() {

        var job = require('../../../lib/cluster/runners/job')(global_context).initialize();

        expect(job.reader).toBeDefined();
        expect(job.sender).toBeDefined();
        expect(job.queue).toBeDefined();
        expect(job.jobConfig).toBeDefined();

        expect(job.analytics).toEqual(false);
        expect(typeof job.reader.newReader).toEqual('function');
        expect(typeof job.reader.newSlicer).toEqual('function');
        expect(typeof job.sender.newSender).toEqual('function');
        expect(Array.isArray(job.jobs)).toBeTruthy();
        expect(job.readerConfig).toEqual({
            _op: 'elasticsearch_data_generator',
            size: 5000,
            file_path: '/Users/Projects/data.js'
        });
        expect(job.max_retries).toEqual(3);

        expect(job.jobConfig).toEqual({
            name: 'Data Generator',
            lifecycle: 'once',
            interval: '',
            analytics: false,
            max_retries: 3,
            slicers: 1,
            workers: 4,
            operations: [
                {
                    _op: 'elasticsearch_data_generator',
                    size: 5000,
                    file_path: '/Users/Projects/data.js'
                },
                {
                    _op: 'elasticsearch_index_selector',
                    index: 'bigdata5',
                    type: 'events',
                    preserve_id: false,
                    id_field: '',
                    timeseries: '',
                    index_prefix: '',
                    date_field: '@timestamp',
                    delete: false,
                    update: false,
                    upsert: false,
                    update_fields: [],
                    script_file: '',
                    script_params: {}
                },
                {_op: 'elasticsearch_bulk', size: 5000}],
            logger: undefined
        });
    });

    it('getJob will return the job.json', function() {

        var results = internal.getJob(process.env.job);

        expect(results).toEqual(JSON.parse(job));

    });

    it('initializeWorkers will immediately make all workers by default', function() {

        spyOn(global_context.foundation, 'startWorkers');

        var validJob = {progressive_start: false, workers: 4};

        internal.initializeWorkers(validJob);

        expect(global_context.foundation.startWorkers).toHaveBeenCalled();
        expect(global_context.foundation.startWorkers).toHaveBeenCalledWith(4);

    });

    it('initializeWorkers will ramp up workers over time if flagged', function() {
        var foundation = {
            startWorkers: function() {
            }
        };

        //starting off with one worker
        var context = {
            foundation: foundation,
            cluster: {
                workers: {1: 'worker'}
            }
        };

        var internal = require('../../../lib/cluster/runners/job')(global_context).__test_context(context);

        spyOn(context.foundation, 'startWorkers');

        var validJob = {progressive_start: 10, workers: 3};

        jasmine.clock().install();

        internal.initializeWorkers(validJob);

        //mocking second and third workers being added
        var addWorker = setInterval(function() {
            var id = 1;
            context.cluster.workers[String(id)] = 'anotherWorker';
            id += 1
        }, 3000);

        jasmine.clock().tick(7000);

        expect(context.foundation.startWorkers.calls.count()).toEqual(2);
        expect(context.foundation.startWorkers).toHaveBeenCalledWith(1);

        clearInterval(addWorker);

        jasmine.clock().uninstall();

    });

    it('initalizeLogger acts as an interface to makeLogger in terafoundation', function() {
        var context = {
            foundation: {
                makeLogger: function(job, logger) {
                    return [job, logger]
                }
            }
        };
        var job = {name: 'someName'};
        var loggerName = 'Name';

        var internal = require('../../../lib/cluster/runners/job')(global_context).__test_context(context);

        var results = internal.initializeLogger(job, loggerName);

        expect(results[0]).toEqual('Name');
        expect(results[1]).toEqual('someName');

    });
});
