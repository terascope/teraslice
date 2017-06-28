'use strict';

var esModerator = require('../../lib/cluster/moderator/modules/elasticsearch');
var Promise = require('bluebird');

describe('elasticsearch moderator', function() {

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
                moderator_resume: 0.5
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
            }
        },
        logger: logger
    };


    it('can initialize', function(done) {
        var moderator = esModerator(context, logger);

        moderator.initialize()
            .then(function(results) {
                expect(results).toBeTruthy();
                done()
            })
            .catch(function(err) {
                fail('elasticsearch moderator could not initialize');
                done()
            })
    });

    it('can checkService', function(done) {
        var moderator = esModerator(context, logger);

        moderator.initialize()
            .then(function() {
                return moderator.check_service()
            })
            .then(function(results) {
                expect(results).toEqual({pause: null, resume: [{type: 'elasticsearch', connection: 'default'}]});
                done()
            })
            .catch(function(err) {
                fail('elasticsearch checkService error occured');
                done()
            })
    });

    it('can checkConnectionStates', function(done) {
        var moderator = esModerator(context, logger);

        moderator.initialize()
            .then(function() {
                return moderator.check_service()
            })
            .then(function() {
                return moderator.checkConnectionStates(['default'])
            })
            .then(function(results) {
                expect(results).toEqual(true);
                done()
            })
            .catch(function(err) {
                fail('error with checkConnectionStates test');
                done()
            })
    });

    it('checkConnectionStates can return connections that need to be paused and resumed', function(done) {
        var moderator = esModerator(context, logger);
        nodesStats.nodes.default.thread_pool.get.queue = 200;
        moderator.initialize()
            .then(function(bool) {
                expect(bool).toEqual(true);
                return moderator.check_service()
            })
            .then(function(results) {
                //state is throttled starting off until it runs check_services, it remains throttled because of queue = 200
                expect(results).toEqual({pause: null, resume: null});
                return moderator.checkConnectionStates(['default'])
            })
            .then(function(results) {
                expect(results).toEqual(false);
                //reset value to be healthy
                nodesStats.nodes.default.thread_pool.get.queue = 10;
                return moderator.check_service()
            })
            .then(function(results) {
                expect(results).toEqual({pause: null, resume: [{type: 'elasticsearch', connection: 'default'}]});
                return moderator.checkConnectionStates(['default'])
            })
            .then(function(results) {
                expect(results).toEqual(true);
                done()
            })
            .catch(function(err) {
                fail('error with checkConnectionStates test');
                done()
            })
    });

});
