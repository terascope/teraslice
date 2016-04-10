var Promise = require('bluebird');
var fs = require('fs');

var Queue = require('../../lib/utils/queue');

var global_context = {
    sysconfig: {
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


describe('op_runner', function() {

    var path = process.cwd() + '/testing_for_teraslice';
    var subPath = path + '/subdir';

    var slicer = require('../../lib/cluster/slicer')(global_context);

    var internal = slicer.__test_context();

    it('once processes data and exits appropriately', function(done) {
        var results;
        var endMsg;

        var workerQueue = new Queue;
        var retryQueue = new Queue;

        workerQueue.enqueue({id: 'someID'});
        workerQueue.enqueue({id: 'anotherID'});
        workerQueue.enqueue({id: 'dataNullID'});
        workerQueue.enqueue({id: 'terminatingID'});

        retryQueue.enqueue({retry: 'data'});

        var passedData = {some: 'data'};

        var slicer = function(msg) {
            if (msg.id === 'dataNullID') {

                passedData = null;
            }
            return passedData;
        };

        var job = {
            jobConfig: {
                logger: function() {
                }
            },
            stateName: subPath + '/__DataGenerator_state',
            logData: {
                retryQueue: retryQueue
            }
        };

        var fn = internal.once(slicer, workerQueue, job);

        Promise.resolve(fn())
            .then(function() {
                expect(results[0]).toEqual('someID');
                expect(results[1]).toEqual({message: 'data', data: {retry: 'data'}});
                return Promise.resolve(fn())
            })
            .then(function() {
                expect(results[0]).toEqual('anotherID');
                expect(results[1]).toEqual({message: 'data', data: {some: 'data'}});
                return Promise.resolve(fn())
            })
            .then(function() {
                //first process done
                return Promise.resolve(fn())
            })
            .then(function() {
                //second process done
                expect(endMsg).toEqual('job finished');
                done()
            });

    });
})