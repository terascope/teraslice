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
                            return Promise.resolve({

                            })
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
    var path = process.cwd() + '/testing_for_teraslice';
    var subPath = path + '/subdir';

    var job_runner = require('../../../lib/cluster/runners/job')(global_context);

    var internal = job_runner.__test_context();

    //will set in stateLog test
    var subPathState;

    function deleteFolder(path) {
        try {
            fs.readdirSync(path).forEach(function(file, index) {
                var curPath = path + "/" + file;
                if (fs.lstatSync(curPath).isDirectory()) {
                    deleteFolder(curPath);
                } else { // delete file
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(path);
        }
        catch (e) {

        }
    }

    var job = JSON.stringify({
        "name": "Data Generator",
        "lifecycle": "once",
        "analytics": false,
        "operations": [
            {
                "_op": "elasticsearch_data_generator",
                "size": 5000,
                "file_path": "/Users/jarednoble/Projects/data.js"
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

    beforeAll(function() {
        var data1 = JSON.stringify(module.exports = [{first: 'data', more: {data: 'in here'}}]);
        var data2 = JSON.stringify([{second: 'data', more: {data: 'in here'}}]);
        var data3 = JSON.stringify([{third: 'data', more: {data: 'in here'}}]);

        try {
            fs.mkdirSync(path);
        } catch (e) {
            if (e.code != 'EEXIST') throw e;
        }

        try {
            fs.mkdirSync(path + '/readers');
        } catch (e) {
            if (e.code != 'EEXIST') throw e;
        }

        try {
            fs.mkdirSync(subPath);
        } catch (e) {
            if (e.code != 'EEXIST') throw e;
        }

        fs.writeFileSync(path + '/readers/elasticsearch_reader.js', 'module.exports =' + data1);
        fs.writeFileSync(path + '/file2.js', data2);
        fs.writeFileSync(subPath + '/file3.js', data3);

    });

    afterAll(function() {

        //remove enviroment variable
        delete process.env.job;

        deleteFolder(path);

    });

    it('job_runner.initialize returns defaults and functions to start the job', function() {

        function getOp(op) {
            return op._op;
        }

        var job = require('../../../lib/cluster/runners/job')(global_context).initialize();

        job.then(function(allConfig) {
            expect(allConfig.reader).toBeDefined();
            expect(allConfig.sender).toBeDefined();
            expect(allConfig.queue).toBeDefined();
            expect(allConfig.jobConfig).toBeDefined();

            expect(allConfig.analytics).toEqual(false);
            expect(typeof allConfig.reader.newReader).toEqual('function');
            expect(typeof allConfig.reader.newSlicer).toEqual('function');
            expect(typeof allConfig.sender.newSender).toEqual('function');
            expect(Array.isArray(allConfig.jobs)).toBeTruthy();
            expect(allConfig.jobs.map(getOp)).toEqual(JSON.parse(job).operations.map(getOp));
            expect(allConfig.readerConfig).toEqual({
                _op: 'elasticsearch_data_generator',
                size: 5000,
                file_path: '/Users/jarednoble/Projects/data.js'
            });
            expect(allConfig.max_retries).toEqual(3);
            expect(allConfig.stateName).toEqual(subPath + '/__DataGenerator_state');
            expect(allConfig.scheduler.toString()).toEqual(config.once.toString());

            expect(allConfig.jobConfig).toEqual({
                name: 'Data Generator',
                lifecycle: 'once',
                interval: '',
                analytics: false,
                max_retries: 3,
                workers: 4,
                operations: [
                    {
                        _op: 'elasticsearch_data_generator',
                        size: 5000,
                        file_path: '/Users/jarednoble/Projects/data.js'
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
    });


    it('getJob will return the job.json', function() {

        var results = internal.getJob(process.env.job);

        expect(results).toEqual(JSON.parse(job));

    });


    it('initializeWorkers will immediately make all workers by default', function() {
        /*var foundation = {
            startWorkers: function() {
            }
        };

        var context = {
            foundation: foundation
        };*/

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
