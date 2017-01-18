'use strict';

var esModerator = require('../../lib/cluster/moderator/index');
var Promise = require('bluebird');

describe('elasticsearch moderator', function() {

    var events = require('events');
    var eventEmitter = new events.EventEmitter();

    var fakeClusterMaster = require('socket.io')();

    fakeClusterMaster.on('connection', function(socket) {
        socket.on('moderator:online', function(data) {
            eventEmitter.emit('moderator:online', data)
        });
        socket.on('moderator:pause_jobs', function(data) {
            eventEmitter.emit('moderator:pause_jobs', data)
        });
        socket.on('moderator:resume_jobs', function(data) {
            eventEmitter.emit('moderator:resume_jobs', data)
        });
    });

    fakeClusterMaster.listen(9999);

    function waitForEvent(eventName, fn) {
        return new Promise(function(resolve, reject) {
            eventEmitter.on(eventName, function(data) {
                resolve(data)
            });
            if (fn) {
                fn();
            }
        })
    }

    var registeredProcessEvents = {};

    var logger = {
        error: function() {
        },
        debug: function() {
        },
        info: function() {
        },
        warn: function() {
        },
        trace: function() {
        }
    };

    var nodes = {
        nodes: {
            default: {
                thread_pool: {
                    index: {queue_size: 100, other: 300},
                    search: {queue_size: 100, other: 300},
                    get: {queue_size: 100, other: 300},
                    bulk: {queue_size: 100, other: 300},
                    other: {queue_size: 100, other: 300}
                }
            }
        }
    };

    var nodesStats = {
        nodes: {
            default: {
                thread_pool: {
                    index: {queue: 10},
                    search: {queue: 10},
                    get: {queue: 10},
                    bulk: {queue: 10},
                    other: {queue: 10}
                }
            }
        }
    };

    var context = {
        sysconfig: {
            teraslice: {
                moderator_limit: 0.8,
                moderator_resume: 0.5,
                moderator_interval: 10,
                master_hostname: 'localhost',
                port: 9999
            },
            terafoundation: {
                connectors: {
                    elasticsearch: {
                        default: {
                            host: [
                                "127.0.0.1:9200"
                            ],
                            keepAlive: true,
                            maxRetries: 5,
                            maxSockets: 20
                        }
                    }
                }
            }
        },
        foundation: {
            getConnection: function() {
                return {
                    client: {
                        nodes: {
                            info: function() {
                                return Promise.resolve(nodes)
                            },
                            stats: function() {
                                return Promise.resolve(nodesStats)
                            }
                        }
                    }
                }
            },
            makeLogger: function() {
                return logger
            }
        },
        logger: logger,
        __testingModule: {
            env: {
                assignment: 'moderator'
            },
            send: function(data) {
                eventEmitter.emit('node:message:processed', data)
            },
            on: function(key, fn) {
                registeredProcessEvents[key] = fn
            }
        }
    };

    //used to make sure the moderator engine has time to run
    function delayTime() {
        return new Promise(function(resolve, reject) {
            setTimeout(function() {
                resolve()
            }, 70)
        });
    }


    beforeEach(function() {
        nodesStats.nodes.default.thread_pool.get.queue = 10;
    });

    it('can initialize', function(done) {
        var moderator = esModerator(context, logger);

        waitForEvent('moderator:online')
            .then(function(results) {
                expect(results).toEqual({moderator: 'moderator:elasticsearch'});
                done();
            })
            .catch(function(err) {
                console.log('Error with initializing moderator', err);
                done();
            });
    });


    it('can check connections', function(done) {
        var moderator = esModerator(context, logger);

        function checkConnection() {
            fakeClusterMaster.emit('cluster:moderator:connection_ok', {data: ['default']});
        }

        waitForEvent('moderator:online')
            .then(function() {
                return waitForEvent('node:message:processed', checkConnection);
            })
            .then(function(results) {
                expect(results.canRun).toEqual(true);
                done()
            })
            .catch(function(err) {
                console.log('Error with connection ok function for the moderator', err);
                done();
            });
    });

    it('can send pause and resume jobs events', function(done) {
        nodesStats.nodes.default.thread_pool.get.queue = 200;

        var moderator = esModerator(context, logger);

        waitForEvent('moderator:pause_jobs')
            .then(function(results) {
                expect(results).toEqual([{type: 'elasticsearch', connection: 'default'}]);
                nodesStats.nodes.default.thread_pool.get.queue = 10;
                return waitForEvent('moderator:resume_jobs')
            })
            .then(function(results) {
                expect(results).toEqual([{type: 'elasticsearch', connection: 'default'}]);
                done()
            })
            .catch(function(err) {
                console.log('Error with pause job test for the moderator', err);
                done();
            });
    });

    it('can query to check of bad connections', function(done) {
        nodesStats.nodes.default.thread_pool.get.queue = 200;

        var moderator = esModerator(context, logger);

        function checkConnection() {
            fakeClusterMaster.emit('cluster:moderator:connection_ok', {data: ['default']});
        }

        waitForEvent('moderator:online')
            .then(function() {
                return delayTime()
            })
            .then(function() {
                return waitForEvent('node:message:processed', checkConnection);
            })
            .then(function(results) {
                expect(results.canRun).toEqual(false);
                done()
            })
            .catch(function(err) {
                console.log('Error with connection ok function for the moderator', err);
                done();
            });
    });

});