'use strict';

var esModerator = require('../../lib/cluster/moderator/modules/elasticsearch');
var Promise = require('bluebird');

fdescribe('elasticsearch moderator', function() {

    var express = require('express');
    var fakeElasticsearch = express();
    fakeElasticsearch.get('*', function(req, res) {
        console.log('getting called');
        res.send('hello')
    });
    fakeElasticsearch.listen(9200);

    var logger = {
        error: function() {
        },
        debug: function() {
        },
        info: function() {
        },
        warn: function() {
        }
    };

    var keyDict = {index: true, search: true, get: true, bulk: true};


    var nodes = {
        first: {
            nodes: {
                node1: {
                    thread_pool: {
                        index: {queue_size: 100, other: 300},
                        search: {queue_size: 100, other: 300},
                        get: {queue_size: 100, other: 300},
                        bulk: {queue_size: 100, other: 300},
                        other: {queue_size: 100, other: 300}
                    }
                },
                node2: {
                    thread_pool: {
                        index: {queue_size: 100, other: 300},
                        search: {queue_size: 100, other: 300},
                        get: {queue_size: 100, other: 300},
                        bulk: {queue_size: 100, other: 300},
                        other: {queue_size: 100, other: 300}
                    }
                }
            }
        },
        second: {
            nodes: {
                node1: {
                    thread_pool: {
                        index: {queue_size: 100, other: 300},
                        search: {queue_size: 100, other: 300},
                        get: {queue_size: 100, other: 300},
                        bulk: {queue_size: 100, other: 300},
                        other: {queue_size: 100, other: 300}
                    }
                },
                node2: {
                    thread_pool: {
                        index: {queue_size: 100, other: 300},
                        search: {queue_size: 100, other: 300},
                        get: {queue_size: 100, other: 300},
                        bulk: {queue_size: 100, other: 300},
                        other: {queue_size: 100, other: 300}
                    }
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
                                return Promise.resolve()
                            },
                            stats: function() {
                            }
                        }
                    }
                }
            }
        },
        logger: logger
    };


    var moderator = esModerator(context, logger);


    fit('can run', function(done) {
        moderator.initialize()
            .then(function(results) {
                console.log('results', results);
                done()
            })
            .catch(function(err) {
                console.log('err', err);
                done()
            })
    })

});