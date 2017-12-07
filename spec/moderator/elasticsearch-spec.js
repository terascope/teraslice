'use strict';

const esModerator = require('../../lib/cluster/moderator/modules/elasticsearch');
const Promise = require('bluebird');
const events = require('events');

const eventEmitter = new events.EventEmitter();

describe('elasticsearch moderator', () => {
    const logger = {
        error() {
        },
        debug() {
        },
        info() {
        },
        warn() {
        },
        trace() {
        }
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
                moderator_resume: 0.5
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
            getEventEmitter() {
                return eventEmitter;
            }
        },
        logger
    };


    it('can initialize', (done) => {
        const moderator = esModerator(context, logger);

        moderator.initialize()
            .then((results) => {
                expect(results).toBeTruthy();
                done();
            })
            .catch(() => {
                fail('elasticsearch moderator could not initialize');
                done();
            });
    });

    it('can checkService', (done) => {
        const moderator = esModerator(context, logger);

        moderator.initialize()
            .then(() => moderator.check_service())
            .then((results) => {
                expect(results).toEqual({ pause: null, resume: [{ type: 'elasticsearch', connection: 'default' }] });
                done();
            })
            .catch(() => {
                fail('elasticsearch checkService error occured');
                done();
            });
    });

    it('can checkConnectionStates', (done) => {
        const moderator = esModerator(context, logger);

        moderator.initialize()
            .then(() => moderator.check_service())
            .then(() => moderator.checkConnectionStates(['default']))
            .then((results) => {
                expect(results).toEqual(true);
                done();
            })
            .catch(() => {
                fail('error with checkConnectionStates test');
                done();
            });
    });

    it('checkConnectionStates can return connections that need to be paused and resumed', (done) => {
        const moderator = esModerator(context, logger);
        nodesStats.nodes.default.thread_pool.get.queue = 200;
        moderator.initialize()
            .then((bool) => {
                expect(bool).toEqual(true);
                return moderator.check_service();
            })
            .then((results) => {
                // state is throttled starting off until it runs check_services, it remains
                // throttled because of queue = 200
                expect(results).toEqual({ pause: null, resume: null });
                return moderator.checkConnectionStates(['default']);
            })
            .then((results) => {
                expect(results).toEqual(false);
                // reset value to be healthy
                nodesStats.nodes.default.thread_pool.get.queue = 10;
                return moderator.check_service();
            })
            .then((results) => {
                expect(results).toEqual({ pause: null, resume: [{ type: 'elasticsearch', connection: 'default' }] });
                return moderator.checkConnectionStates(['default']);
            })
            .then((results) => {
                expect(results).toEqual(true);
                done();
            })
            .catch(() => {
                fail('error with checkConnectionStates test');
                done();
            });
    });
});
