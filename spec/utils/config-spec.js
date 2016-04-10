'use strict';
var config = require('../../lib/utils/config');
var fs = require('fs');

var lineByLine = require('n-readlines');

var Queue = require('../../lib/utils/queue');

describe('config', function() {

    var path = process.cwd() + '/testing_for_teraslice';
    var subPath = path + '/subdir';

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

    var logsData = ['start__{"start":"2016-01-04T23:00:00+00:00","end":"2016-01-04T23:05:00+00:00","count":718}',
        'start__{"start":"2016-01-04T23:05:00+00:00","end":"2016-01-04T23:10:00+00:00","count":727}',
        'start__{"start":"2016-01-04T23:10:00+00:00","end":"2016-01-04T23:15:00+00:00","count":677}',
        'completed__{"start":"2016-01-04T23:00:00+00:00","end":"2016-01-04T23:05:00+00:00","count":718}',
        'start__{"start":"2016-01-04T23:15:00+00:00","end":"2016-01-04T23:20:00+00:00","count":740}',
        'completed__{"start":"2016-01-04T23:15:00+00:00","end":"2016-01-04T23:20:00+00:00","count":740}',
        'start__{"start":"2016-01-04T23:20:00+00:00","end":"2016-01-04T23:25:00+00:00","count":717}',
        'completed__{"start":"2016-01-04T23:10:00+00:00","end":"2016-01-04T23:15:00+00:00","count":677}',
        'start__{"start":"2016-01-04T23:25:00+00:00","end":"2016-01-04T23:30:00+00:00","count":693}',
        'completed__{"start":"2016-01-04T23:05:00+00:00","end":"2016-01-04T23:10:00+00:00","count":727}',
    ];

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
                "_op": "elasticsearch_bulk_insert",
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



    //This test need to remain here, the tests below require the changes this test makes
    /*it('stateLog will make a log for the job name', function() {
        var context = {
            sysconfig: {
                terafoundation: {
                    log_path: subPath
                }
            }
        };
        var job = {name: 'test'};
        var retry = false;

        //this is was file will be made
        subPathState = subPath + '/__test_state';

        expect(function() {
            fs.accessSync(subPathState)
        }).toThrow();

        config.stateLog(context, job, retry);

        expect(function() {
            fs.accessSync(subPathState)
        }).not.toThrow();

    });

    it('writeToStateFile will flush writes to stateLog', function() {

        //Nothing in it yet
        expect(fs.readFileSync(subPathState, 'utf-8')).toEqual('');

        logsData.forEach(function(str) {
            var logLine = str.split('__');
            config.writeToStateFile(subPathState, JSON.parse(logLine[1]), logLine[0]);
        });

        var log = new lineByLine(subPathState);
        var line;
        var results = [];

        var regex = /\\/gm;

        while (line = log.next()) {
            if (line.length) {
                var logLine = line.toString('ascii');
                results.push(logLine.replace(regex, ''))
            }
        }

        expect(results).toEqual(logsData)

    });*/

    it('compareDates will return the latest completed chunk', function() {

        var prev1 = {start: "2016-01-04T23:00:00+00:00", end: "2016-01-04T23:05:00+00:00"};
        var prev2 = {start: "2016-01-04T23:00:00+00:00", end: "2016-01-04T23:05:00+00:00"};
        var prev3 = {start: "2016-01-04T23:00:00+00:00"};
        var prev4 = {start: "2016-01-04T23:00:00+00:00", end: "2016-01-04T23:15:00+00:00"};

        var accum1 = {start: "2016-01-04T23:05:00+00:00", end: "2016-01-04T23:10:00+00:00"};
        var accum2 = {start: "2016-01-04T23:05:00+00:00"};
        var accum3 = {start: "2016-01-04T23:05:00+00:00", end: "2016-01-04T23:10:00+00:00"};
        var accum4 = {start: "2016-01-04T23:05:00+00:00", end: "2016-01-04T23:10:00+00:00"};

        expect(config.compareDates(prev1, accum1)).toEqual(accum1);
        expect(config.compareDates(prev2, accum2)).toEqual(prev2);
        expect(config.compareDates(prev3, accum3)).toEqual(accum3);
        expect(config.compareDates(prev4, accum4)).toEqual(prev4);

    });

    /*it('getStartFromLog will return the next slice to start from and a queue containing unfinished slices', function() {

        var results = config.getStartFromLog(subPathState);

        expect(results.startFrom).toEqual('2016-01-04T23:30:00+00:00');
        expect(results.retryQueue.size()).toEqual(2);
        expect(results.retryQueue.dequeue()).toEqual({
            start: '2016-01-04T23:20:00+00:00',
            end: '2016-01-04T23:25:00+00:00',
            count: 717
        });
        expect(results.retryQueue.dequeue()).toEqual({
            start: '2016-01-04T23:25:00+00:00',
            end: '2016-01-04T23:30:00+00:00',
            count: 693
        });

    });*/



    it('lifecycle will return the correct function for exiting the system', function() {

        expect((config.lifecycle({lifecycle: 'once'})).toString()).toEqual(config.once.toString());
        expect((config.lifecycle({lifecycle: 'periodic'})).toString()).toEqual(config.periodic.toString());
        expect((config.lifecycle({lifecycle: 'persistent'})).toString()).toEqual(config.persistent.toString());

    });

    it('persistent uses slicer to return data, does not complete', function(done) {

        var results;
        var workerQueue = new Queue;
        workerQueue.enqueue({id: 'someID'});

        var slicer = function(msg) {
            return {some: 'data'}
        };

        var job = {
            jobConfig: {
                logger: function() {
                }
            },
            stateName: subPath + '/__DataGenerator_state'

        };

        var sendMessage = function(id, msg) {
            results = [id, msg];
        };

        var fn = config.persistent(slicer, workerQueue, job, sendMessage);

        Promise.resolve(fn()).then(function() {
            expect(results[0]).toEqual('someID');
            expect(results[1]).toEqual({message: 'data', data: {some: 'data'}});

            done()

        });

    });


    it('getClient returns client with certain defaults', function() {
        var context = {
            foundation: {
                getConnection: function(config) {
                    return {
                        client: function() {
                            return config;
                        }
                    }
                }
            }
        };
        var opConfig1 = {};
        var opConfig2 = {
            connection: 'otherConnection'
        };
        var opConfig3 = {
            connection: 'thirdConnection',
            connection_cache: false
        };

        var type = 'elasticsearch';

        var results1 = config.getClient(context, opConfig1, type);
        var results2 = config.getClient(context, opConfig2, type);
        var results3 = config.getClient(context, opConfig3, type);

        expect(typeof results1).toEqual('function');
        expect(results1()).toEqual({endpoint: 'default', cached: true, type: 'elasticsearch'});

        expect(typeof results2).toEqual('function');
        expect(results2()).toEqual({endpoint: 'otherConnection', cached: true, type: 'elasticsearch'});

        expect(typeof results3).toEqual('function');
        expect(results3()).toEqual({endpoint: 'thirdConnection', cached: false, type: 'elasticsearch'});

    });

    /*it('validateNumOfWorkers compares number of workers allowed vs requested', function() {

        var warnMsg;
        var context = {
            logger: {
                warn: function(str) {
                    warnMsg = str;
                }
            },
            sysconfig: {
                terafoundation: {
                    workers: 5
                }
            },
            cluster: {
                isMaster: false
            }
        };

        var results1 = config.validateNumOfWorkers(context);

        expect(results1).toEqual(4);
        expect(warnMsg).not.toBeDefined();

        context.sysconfig.terafoundation.workers = 3;

        var results2 = config.validateNumOfWorkers(context);

        expect(results2).toEqual(3);
        expect(warnMsg).toEqual(' The number of workers specified on the job ( 4 ) is higher than what has been ' +
            'allocated in the config file at terafoundation.workers ( 3 ). The job will run using 3workers. If 4 are ' +
            'required adjust the value set for terafoundation.workers in the system configuration. ');

    });*/

    /*it('transferLogs renames the state log to completed after finishing', function() {
        var pathState = subPath + '/__DataGenerator_state';
        var pathCompleted = subPath + '/__DataGenerator_completed';

        var logger = {
            info: function() {
            }
        };

        expect(function() {
            fs.accessSync(pathState, 'utf-8')
        }).not.toThrow();

        expect(function() {
            fs.accessSync(pathCompleted, 'utf-8')
        }).toThrow();

        config.transferLogs(logger, pathState);

        expect(function() {
            fs.accessSync(pathState, 'utf-8')
        }).toThrow();

        expect(function() {
            fs.accessSync(pathCompleted, 'utf-8')
        }).not.toThrow();

    });*/

});

