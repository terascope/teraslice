'use strict';

const _ = require('lodash');
const Promise = require('bluebird');

describe('elasticsearch_api', () => {

    const esApi = require('../index');
    let query;
    let recordsReturned = [];
    let failed = 0;
    let failures = [];
    let total = 0;
    let warnMsg;
    let bulkError = false;
    let searchError = false;

    beforeEach(() => {
        searchError = false;
        failed = 0;
        failures = [];
        bulkError: false;
    });

    function getData() {
        return  {
            _shards: {
                failed,
                failures
            },
            hits: {
                total,
                hits: recordsReturned
            }
        };
    }

    function waitFor(time, fn) {
        return new Promise(resolve => setTimeout(() => {
            if (fn) fn();
            resolve(true)
        }, time))
    }

    function postedData(action, id) {
        const result =  {
            _index: 'bigdata7',
            _type: 'events',
            _id: id || 'AWKWOrWojTNwAyqyzq5l',
            _version: 1,
            result: action,
            _shards: { total: 2, successful: 1, failed: 0 }
        };
        if (action === 'created') result.created = true;
        if (action === 'deleted') result.found = true;
        return result;
    }

    const template = {
        "template": "test*",
        "settings": {
            "index.number_of_shards": 5,
            "index.number_of_replicas": 1
        },
        "mappings": {
            "state": {
                "_all": {
                    "enabled": true
                },
                "dynamic": "false",
                "properties": {
                    ip: {
                        "type": "string",
                        "index": "not_analyzed"
                    },
                    userAgent: {
                        "type": "string",
                        "index": "not_analyzed"
                    },
                    url: {
                        "type": "string",
                        "index": "not_analyzed"
                    },
                    uuid: {
                        "type": "string",
                        "index": "not_analyzed"
                    },
                    created: {
                        "type": "date"
                    },
                    ipv6: {
                        "type": "string",
                        "index": "not_analyzed"
                    },
                    location: {
                        type: 'geo_point'
                    },
                    bytes: {
                        "type": "integer"
                    }
                }
            }
        }
    };

    function getRecoveryData(index) {
        const obj = {};
        obj[index] = { shards: [{ shard: 1 }] };
        return obj;
    }

    function createBulkResponse(results) {
        const response = { took: 22, errors: false, items: results};
        if (bulkError) {
            response.errors = true;
            response.items = results.body.map((obj, index) => {
                _.forOwn(obj, (value, key) => {
                    obj[key] = _.assign(value, { error: { type: bulkError[index] || 'someType', reason: 'someReason'}})
                });
                return obj;
            })
        }
        return response;
    }

    const client = {
        mget: () => Promise.resolve(getData()),
        get: () => Promise.resolve(recordsReturned[0]),
        index: () => Promise.resolve(postedData('created')),
        create: (obj) => Promise.resolve(postedData('created', obj.id)),
        update: () => Promise.resolve(postedData('updated')),
        delete: () => Promise.resolve(postedData('deleted')),
        bulk: (data) => Promise.resolve(createBulkResponse(data)),
        search: (_query) => {
            query = _query;
            if (searchError) return Promise.reject(searchError);
            return Promise.resolve(getData())
        },
        indices: {
            exists: () => Promise.resolve(true),
            create: () => Promise.resolve({ "acknowledged":true, "shards_acknowledged":true }),
            refresh: () => Promise.resolve({ _shards: { total: 10, successful: 5, failed: 0 } }),
            recovery: (query) => Promise.resolve(getRecoveryData(query.index)),
            getSettings: () => {
                const obj = {};
                obj.some_index = { settings: { index: { max_result_window: 1000000 } } };
                return Promise.resolve(obj)
            },
            putTemplate: () => Promise.resolve({ "acknowledged":true })
        },
        nodes: {
            info: () => Promise.resolve({ _nodes: {} }),
            stats : () => Promise.resolve({ _nodes: {} })
        },
        cluster: {
            stats:() => Promise.resolve({ nodes: { versions: ["5.4.1"] } })
        },
        __testing: {
            start: 100,
            limit: 500
        }
    };

    const logger = {
        error() {},
        info() {},
        warn(msg) {warnMsg = msg;},
        trace() {},
        debug() {},
        flush() {}
    };

    it('can instantiate', () => {
        let api;
        expect(() => api = esApi(client, logger)).not.toThrow();
        expect(api).toBeDefined();
        expect(typeof api).toEqual('object');
        expect(api.search).toBeDefined();
        expect(typeof api.search).toEqual('function');
        expect(api.count).toBeDefined();
        expect(typeof api.count).toEqual('function');
        expect(api.get).toBeDefined();
        expect(typeof api.get).toEqual('function');
        expect(api.index).toBeDefined();
        expect(typeof api.index).toEqual('function');
        expect(api.indexWithId).toBeDefined();
        expect(typeof api.indexWithId).toEqual('function');
        expect(api.create).toBeDefined();
        expect(typeof api.create).toEqual('function');
        expect(api.update).toBeDefined();
        expect(typeof api.update).toEqual('function');
        expect(api.remove).toBeDefined();
        expect(typeof api.remove).toEqual('function');
        expect(api.version).toBeDefined();
        expect(typeof api.version).toEqual('function');
        expect(api.putTemplate).toBeDefined();
        expect(typeof api.putTemplate).toEqual('function');
        expect(api.bulkSend).toBeDefined();
        expect(typeof api.bulkSend).toEqual('function');
        expect(api.nodeInfo).toBeDefined();
        expect(typeof api.nodeInfo).toEqual('function');
        expect(api.nodeStats).toBeDefined();
        expect(typeof api.nodeStats).toEqual('function');
        expect(api.buildQuery).toBeDefined();
        expect(typeof api.buildQuery).toEqual('function');
        expect(api.indexExists).toBeDefined();
        expect(typeof api.indexExists).toEqual('function');
        expect(api.indexCreate).toBeDefined();
        expect(typeof api.indexCreate).toEqual('function');
        expect(api.indexRefresh).toBeDefined();
        expect(typeof api.indexRefresh).toEqual('function');
        expect(api.indexRecovery).toBeDefined();
        expect(typeof api.indexRecovery).toEqual('function');
    });

    it('count returns total amount for query', (done) => {
        const query = { body: 'someQuery'};
        const api = esApi(client, logger);

        Promise.resolve(api.count(query))
            .then((results) => {
                expect(query).toEqual({ body: 'someQuery', size: 0 });
                expect(results).toEqual(0);
                total = 500;
                return api.count(query)
            })
            .then((results) => expect(results).toEqual(500))
            .catch(fail)
            .finally(done)
    });

    it('can search', (done) => {
        const query = { body: 'someQuery'};
        const api = esApi(client, logger);
        const apiFullResponse = esApi(client, logger, { full_response: true });
        recordsReturned = [{ _source: { some: 'data' } }];

        Promise.all([api.search(query), apiFullResponse.search(query)])
            .spread((results1, results2) => {
                expect(results1).toEqual([ recordsReturned[0]._source ]);
                expect(results2).toEqual(getData());
            })
            .catch(fail)
            .finally(done)
    });

    it('search can handle rejection errors', (done) => {
        const query = { body: 'someQuery'};
        const api = esApi(client, logger);
        let queryFailed = false;
        searchError = { body: { error: { type: 'es_rejected_execution_exception' } } };
        recordsReturned = [{ _source: { some: 'data' } }];

        Promise.all([ api.search(query), waitFor(50, () => searchError = false) ])
            .spread((results) => {
                expect(results).toEqual([ recordsReturned[0]._source ]);
                searchError = { body: { error: { type: 'some_thing_else' } } };
                return api.search(query)
                    .catch(err => queryFailed = true)
            })
            .then(() => expect(queryFailed).toEqual(true))
            .catch(fail)
            .finally(done)
    });

    it('search can handle shard errors', (done) => {
        const query = { body: 'someQuery'};
        const api = esApi(client, logger);
        let queryFailed = false;
        failed = 3;
        failures = [{reason: { type: 'es_rejected_execution_exception'} }];
        recordsReturned = [{ _source: { some: 'data' } }];

        Promise.all([
            api.search(query),
            waitFor(20, () => {
                failed = 0;
                failures = [];
            })
        ])
            .spread(results => {
                expect(results).toEqual([ recordsReturned[0]._source ]);
                failed = 4;
                failures = [{reason: { type: 'some other error'} }];
                return Promise.all([
                    api.search(query),
                    waitFor(50, () => {
                        failed = 0;
                        failures = [];
                    })
                ])
                    .catch(err => queryFailed = true)

            })
            .then(() => expect(queryFailed).toEqual(true))
            .catch(fail)
            .finally(done)
    });

    it('can call mget', (done) => {
        const query = { body: 'someQuery'};
        const api = esApi(client, logger);
        recordsReturned = [{ _source: { some: 'data' } }];

        Promise.resolve(api.mget(query))
            .then((results) => expect(results).toEqual(getData()))
            .catch(fail)
            .finally(done)
    });

    it('can call get', (done) => {
        const query = { body: 'someQuery'};
        const api = esApi(client, logger);
        recordsReturned = [{ _source: { some: 'data' } }];

        Promise.resolve(api.get(query))
            .then((results) => expect(results).toEqual(recordsReturned[0]._source))
            .catch(fail)
            .finally(done);
    });

    it('can call index', (done) => {
        const query = { index: 'someIndex', type: 'sometype', body: 'someQuery'};
        const api = esApi(client, logger);

        Promise.resolve(api.index(query))
            .then((results) => expect(results.created).toEqual(true))
            .catch(fail)
            .finally(done);
    });

    it('can call indexWithId', (done) => {
        const query = { index: 'someIndex', id: 'someId', type: 'sometype', body: 'someQuery'};
        const api = esApi(client, logger);
        recordsReturned = [{ _source: { some: 'data' } }];

        Promise.resolve(api.indexWithId(query))
            .then((results) => expect(results).toEqual(query.body))
            .catch(fail)
            .finally(done);
    });

    it('can call create', (done) => {
        const query = { index: 'someIndex', type: 'sometype', body: 'someQuery'};
        const api = esApi(client, logger);

        Promise.resolve(api.create(query))
            .then(results => expect(results).toEqual(query.body))
            .catch(fail)
            .finally(done);
    });

    it('can call update', (done) => {
        const query = { index: 'someIndex', type: 'sometype', body: { doc: { some: 'data' } } };
        const api = esApi(client, logger);

        Promise.resolve(api.update(query))
            .then(results => expect(results).toEqual(query.body.doc))
            .catch(fail)
            .finally(done);
    });

    it('can call remove', (done) => {
        const query = { index: 'someIndex', type: 'sometype', id: 'someId' };
        const api = esApi(client, logger);

        Promise.resolve(api.remove(query))
            .then(results => expect(results).toEqual(true))
            .catch(fail)
            .finally(done);
    });

    it('can call indexExists', (done) => {
        const query = { index: 'someIndex' };
        const api = esApi(client, logger);

        Promise.resolve(api.indexExists(query))
            .then(results => expect(results).toEqual(true))
            .catch(fail)
            .finally(done);
    });

    it('can call indexCreate', (done) => {
        const query = { index: 'someIndex' };
        const api = esApi(client, logger);

        Promise.resolve(api.indexCreate(query))
            .then(results => expect(results.acknowledged).toEqual(true))
            .catch(fail)
            .finally(done);
    });

    it('can call indexRefresh', (done) => {
        const query = { index: 'someIndex' };
        const api = esApi(client, logger);

        Promise.resolve(api.indexRefresh(query))
            .then(results => expect(results).toBeTruthy())
            .catch(fail)
            .finally(done);
    });

    it('can call indexRecovery', (done) => {
        const query = { index: 'someIndex' };
        const api = esApi(client, logger);

        Promise.resolve(api.indexRecovery(query))
            .then(results => expect(results[query.index]).toBeTruthy())
            .catch(fail)
            .finally(done);
    });

    it('can call nodeInfo', (done) => {
        const api = esApi(client, logger);

        Promise.resolve(api.nodeInfo())
            .then(results => expect(results).toBeTruthy())
            .catch(fail)
            .finally(done);
    });

    it('can call nodeStats', (done) => {
        const api = esApi(client, logger);

        Promise.resolve(api.nodeStats())
            .then(results => expect(results).toBeTruthy())
            .catch(fail)
            .finally(done);
    });

    it('can call nodeStats', (done) => {
        const api = esApi(client, logger);

        Promise.resolve(api.nodeStats())
            .then(results => expect(results).toBeTruthy())
            .catch(fail)
            .finally(done);
    });

    it('can warn window size with version', (done) => {
        const api = esApi(client, logger, {index: 'some_index'});

        Promise.resolve(api.version())
            .then(() => expect(warnMsg).toBeTruthy())
            .catch(fail)
            .finally(done);
    });

    it('can call putTemplate', (done) => {
        const api = esApi(client, logger);

        Promise.resolve(api.putTemplate(template, 'somename'))
            .then(results => expect(results.acknowledged).toEqual(true))
            .catch(fail)
            .finally(done);
    });

    it('can call bulkSend', (done) => {
        const api = esApi(client, logger);
        const myBulkData = [
            { index:  { _index: 'some_index', _type: 'events', _id: 1 } },
            { title: 'foo' },
            { delete:  { _index: 'some_index', _type: 'events', _id: 5 } }
        ];

        Promise.resolve(api.bulkSend(myBulkData))
            .then((results) => expect(results).toBeTruthy())
            .catch(fail)
            .finally(done);
    });

    it('can call bulkSend with errors', (done) => {
        const api = esApi(client, logger);
        const myBulkData = [
            { index:  { _index: 'some_index', _type: 'events', _id: 1 } },
            { title: 'foo' },
            { delete:  { _index: 'some_index', _type: 'events', _id: 5 } }
        ];
        bulkError = ['es_rejected_execution_exception', 'es_rejected_execution_exception', 'es_rejected_execution_exception'];
        let queryFailed = false;

        Promise.all([api.bulkSend(myBulkData), waitFor(20, () => bulkError = false)])
            .spread((results) => {
                expect(results).toBeTruthy();
                bulkError = ['some_thing_else', 'some_thing_else', 'some_thing_else'];
                return Promise.all([api.bulkSend(myBulkData), waitFor(20, () => bulkError = false)])
                    .catch((err) => {
                        queryFailed = true;
                        expect(err).toEqual('some_thing_else--someReason')
                    })
            })
            .then(() => expect(queryFailed).toEqual(true))
            .catch(fail)
            .finally(done);
    });

    it('can call buildQuery', () => {
        const api = esApi(client, logger);
        const opConfig1 = { index: 'some_index' };
        const opConfig2 = { index: 'some_index', date_field_name: 'created' };
        const opConfig3 = { index: 'some_index', query: 'someLucene:query' };
        const opConfig4 = { index: 'some_index', query: 'someLucene:query',  fields: ['field1', 'field2'] };

        const msg1 = { count: 100, key: 'someKey' };
        const msg2 = { count: 100, start: new Date(), end: new Date() };
        const msg3 = { count: 100 };

        function makeResponse (opConfig, msg, data){
            const query = {
                index: opConfig.index,
                size: msg.count,
                body: {
                    query: {
                        bool: {
                            must: Array.isArray(data) ? data : [ data ]
                        }
                    }
                }
            };
            if (opConfig.fields) {
                query._source = opConfig.fields;
            }
            return query;
        }
        const response1 = { wildcard: { _uid: 'someKey' } };
        const response2 = { range: { created: { gte: msg2.start, lt: msg2.end } } };
        const response3 = { query_string: { query: opConfig3.query } };
        const response4 = [{ wildcard: { _uid: 'someKey' } }, { query_string: { query: opConfig3.query } }];

        expect(api.buildQuery(opConfig1, msg1)).toEqual(makeResponse(opConfig1, msg1, response1));
        expect(api.buildQuery(opConfig2, msg2)).toEqual(makeResponse(opConfig2, msg2, response2));
        expect(api.buildQuery(opConfig3, msg3)).toEqual(makeResponse(opConfig3, msg3, response3));
        expect(api.buildQuery(opConfig4, msg3)).toEqual(makeResponse(opConfig4, msg3, response3));
        expect(api.buildQuery(opConfig3, msg1)).toEqual(makeResponse(opConfig3, msg1, response4));

    })

});
