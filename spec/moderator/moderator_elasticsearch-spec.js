'use strict';

const esModerator = require('../../lib/cluster/moderator/index');
const Promise = require('bluebird');

describe('elasticsearch moderator', () => {
    const events = require('events');
    const eventEmitter = new events.EventEmitter();

    const fakeClusterMaster = require('socket.io')();

    fakeClusterMaster.on('connection', (socket) => {
        socket.on('moderator:online', (data) => {
            eventEmitter.emit('moderator:online', data);
        });
        socket.on('moderator:pause_jobs', (data) => {
            eventEmitter.emit('moderator:pause_jobs', data);
        });
        socket.on('moderator:resume_jobs', (data) => {
            eventEmitter.emit('moderator:resume_jobs', data);
        });
    });

    fakeClusterMaster.listen(9999);

    function waitForEvent(eventName, fn) {
        return new Promise(((resolve) => {
            eventEmitter.on(eventName, (data) => {
                resolve(data);
            });
            if (fn) {
                fn();
            }
        }));
    }

    const registeredProcessEvents = {};

    const logger = {
        error: () => {},
        info: () => {},
        warn: () => {},
        debug: () => {}
    };

    const nodes = {
        nodes: {
            default: {
                thread_pool: {
                    index: { queue_size: 100, other: 300 },
                    search: { queue_size: 100, other: 300 },
                    get: { queue_size: 100, other: 300 },
                    bulk: { queue_size: 100, other: 300 },
                    other: { queue_size: 100, other: 300 }
                }
            }
        }
    };

    const nodesStats = {
        nodes: {
            default: {
                thread_pool: {
                    index: { queue: 10 },
                    search: { queue: 10 },
                    get: { queue: 10 },
                    bulk: { queue: 10 },
                    other: { queue: 10 }
                }
            }
        }
    };

    const context = {
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
                                '127.0.0.1:9200'
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
            getConnection() {
                return {
                    client: {
                        nodes: {
                            info() {
                                return Promise.resolve(nodes);
                            },
                            stats() {
                                return Promise.resolve(nodesStats);
                            }
                        }
                    }
                };
            },
            makeLogger() {
                return logger;
            },
            getEventEmitter() {
                return eventEmitter;
            }
        },
        apis: {
            foundation: {
                getSystemEvents: () => eventEmitter,
                makeLogger: () => logger
            }
        },
        logger,
        __testingModule: {
            env: {
                assignment: 'moderator'
            },
            send(data) {
                eventEmitter.emit('node:message:processed', data);
            },
            on(key, fn) {
                registeredProcessEvents[key] = fn;
            }
        }
    };

    // used to make sure the moderator engine has time to run
    function delayTime() {
        return new Promise(((resolve) => {
            setTimeout(() => {
                resolve();
            }, 70);
        }));
    }


    beforeEach(() => {
        nodesStats.nodes.default.thread_pool.get.queue = 10;
    });

    xit('can initialize', (done) => {
        const moderator = esModerator(context, logger);

        waitForEvent('moderator:online')
            .then((results) => {
                expect(results).toEqual({ moderator: 'moderator:elasticsearch' });
                done();
            })
            .catch((err) => {
                console.log('Error with initializing moderator', err);
                done();
            });
    });


    xit('can check connections', (done) => {
        const moderator = esModerator(context, logger);

        function checkConnection() {
            fakeClusterMaster.emit('cluster:moderator:connection_ok', { data: ['default'] });
        }

        waitForEvent('moderator:online')
            .then(() => waitForEvent('node:message:processed', checkConnection))
            .then((results) => {
                expect(results.canRun).toEqual(true);
                done();
            })
            .catch((err) => {
                console.log('Error with connection ok function for the moderator', err);
                done();
            });
    });

    xit('can send pause and resume jobs events', (done) => {
        nodesStats.nodes.default.thread_pool.get.queue = 200;

        const moderator = esModerator(context, logger);

        waitForEvent('moderator:pause_jobs')
            .then((results) => {
                expect(results).toEqual([{ type: 'elasticsearch', connection: 'default' }]);
                nodesStats.nodes.default.thread_pool.get.queue = 10;
                return waitForEvent('moderator:resume_jobs');
            })
            .then((results) => {
                expect(results).toEqual([{ type: 'elasticsearch', connection: 'default' }]);
                done();
            })
            .catch((err) => {
                console.log('Error with pause job test for the moderator', err);
                done();
            });
    });

    xit('can query to check of bad connections', (done) => {
        nodesStats.nodes.default.thread_pool.get.queue = 200;

        const moderator = esModerator(context, logger);

        function checkConnection() {
            fakeClusterMaster.emit('cluster:moderator:connection_ok', { data: ['default'] });
        }

        waitForEvent('moderator:online')
            .then(() => delayTime())
            .then(() => waitForEvent('node:message:processed', checkConnection))
            .then((results) => {
                expect(results.canRun).toEqual(false);
                done();
            })
            .catch((err) => {
                console.log('Error with connection ok function for the moderator', err);
                done();
            });
    });
});
