'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const debug = require('debug')('elasticsearch-api');
const esApi = require('..');

describe('elasticsearch-api', () => {
    let recordsReturned = [];
    let searchQuery; // eslint-disable-line
    let failed = 0;
    let failures = [];
    let total = 0;
    let warnMsg;
    let bulkError = false;
    let searchError = false;
    let elasticDown = false;
    let recoverError = false;
    let changeMappings = false;
    let putTemplateCalled = false;
    let reindexCalled = false;
    let isExecutionTemplate = false;
    let indexAlreadyExists = true;
    let indicesDeleteCalled = false;
    let indicesPutAliasCalled = false;

    beforeEach(() => {
        searchQuery = null;
        searchError = false;
        failed = 0;
        failures = [];
        bulkError = false;
        elasticDown = false;
        recoverError = false;
        changeMappings = false;
        putTemplateCalled = false;
        reindexCalled = false;
        isExecutionTemplate = false;
        indexAlreadyExists = true;
        indicesDeleteCalled = false;
        indicesPutAliasCalled = false;
    });

    function getData() {
        return {
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
            resolve(true);
        }, time));
    }

    function postedData(action, id) {
        const result = {
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
        template: 'test*',
        settings: {
            'index.number_of_shards': 5,
            'index.number_of_replicas': 1
        },
        mappings: {
            state: {
                _all: {
                    enabled: true
                },
                dynamic: 'false',
                properties: {
                    ip: {
                        type: 'string',
                        index: 'not_analyzed'
                    },
                    userAgent: {
                        type: 'string',
                        index: 'not_analyzed'
                    },
                    url: {
                        type: 'string',
                        index: 'not_analyzed'
                    },
                    uuid: {
                        type: 'string',
                        index: 'not_analyzed'
                    },
                    created: {
                        type: 'date'
                    },
                    ipv6: {
                        type: 'string',
                        index: 'not_analyzed'
                    },
                    location: {
                        type: 'geo_point'
                    },
                    bytes: {
                        type: 'integer'
                    }
                }
            }
        }
    };

    const template2 = {
        template: 'test*',
        settings: {
            'index.number_of_shards': 5,
            'index.number_of_replicas': 1
        },
        mappings: {
            ex: {
                _all: {
                    enabled: true
                },
                dynamic: 'false',
                properties: {
                    ip: {
                        type: 'string',
                        index: 'not_analyzed'
                    },
                    userAgent: {
                        type: 'string',
                        index: 'not_analyzed'
                    },
                    url: {
                        type: 'string',
                        index: 'not_analyzed'
                    },
                    uuid: {
                        type: 'string',
                        index: 'not_analyzed'
                    },
                    created: {
                        type: 'date'
                    },
                    ipv6: {
                        type: 'string',
                        index: 'not_analyzed'
                    },
                    location: {
                        type: 'geo_point'
                    },
                    bytes: {
                        type: 'integer'
                    }
                }
            }
        }
    };

    function getRecoveryData(index) {
        const obj = {};
        obj[index] = { shards: [{ shard: 1, primary: true, stage: recoverError ? 'notdone' : 'DONE' }] };
        return obj;
    }

    function createBulkResponse(results) {
        const response = { took: 22, errors: false, items: results };
        if (bulkError) {
            response.errors = true;
            response.items = results.body.map((obj, index) => {
                _.forOwn(obj, (value, key) => {
                    obj[key] = _.assign(value, { error: { type: bulkError[index] || 'someType', reason: 'someReason' } });
                });
                return obj;
            });
        }
        return response;
    }

    function simulateTemplateResponse(originalMapping, index, recordType) {
        const results = {};
        results[index] = { mappings: JSON.parse(JSON.stringify(originalMapping.mappings)) };
        // simulate the 'false' to false issue
        results[index].mappings[recordType].dynamic = 'false';
        if (changeMappings) {
            results[index].mappings[recordType].properties.newKey = { type: 'keyword' };
        }
        return results;
    }

    const client = {
        mget: () => Promise.resolve(getData()),
        get: () => Promise.resolve(recordsReturned[0]),
        index: () => Promise.resolve(postedData('created')),
        create: obj => Promise.resolve(postedData('created', obj.id)),
        update: () => Promise.resolve(postedData('updated')),
        delete: () => Promise.resolve(postedData('deleted')),
        bulk: data => Promise.resolve(createBulkResponse(data)),
        search: (_query) => {
            searchQuery = _query;
            if (searchError) return Promise.reject(searchError);
            return Promise.resolve(getData());
        },
        reindex: () => {
            reindexCalled = true;
            return Promise.resolve(true);
        },
        indices: {
            exists: () => {
                if (elasticDown) return Promise.reject(true);
                return Promise.resolve(indexAlreadyExists);
            },
            create: () => Promise.resolve({ acknowledged: true, shards_acknowledged: true }),
            refresh: () => Promise.resolve({ _shards: { total: 10, successful: 5, failed: 0 } }),
            recovery: query => Promise.resolve(getRecoveryData(query.index)),
            getSettings: () => {
                const obj = {};
                obj.some_index = { settings: { index: { max_result_window: 1000000 } } };
                return Promise.resolve(obj);
            },
            putTemplate: () => {
                putTemplateCalled = true;
                return Promise.resolve({ acknowledged: true });
            },
            delete: () => {
                indicesDeleteCalled = true;
                return Promise.resolve(true);
            },
            putAlias: () => {
                indicesPutAliasCalled = true;
                return Promise.resolve(true);
            },
            getMapping: () => {
                let index = 'teracluster__state';
                let type = 'state';
                let templateArg = template;
                if (isExecutionTemplate) {
                    index = 'teracluster__ex';
                    type = 'ex';
                    templateArg = template2;
                    indexAlreadyExists = false;
                }
                return Promise.resolve(simulateTemplateResponse(templateArg, index, type));
            }
        },
        nodes: {
            info: () => Promise.resolve({ _nodes: {} }),
            stats: () => Promise.resolve({ _nodes: {} })
        },
        cluster: {
            stats: () => Promise.resolve({ nodes: { versions: ['5.4.1'] } })
        },
        __testing: {
            start: 100,
            limit: 500
        }
    };

    const logger = {
        error(...args) {
            debug('error:', ...args);
        },
        info(...args) {
            debug('error:', ...args);
        },
        warn(...args) {
            ([warnMsg] = args);
            debug('warn:', ...args);
        },
        trace(...args) {
            debug('trace:', ...args);
        },
        debug(...args) {
            debug('debug:', ...args);
        },
        flush(...args) {
            debug('flush:', ...args);
        }
    };

    it('can instantiate', () => {
        let api;
        expect(() => { api = esApi(client, logger); }).not.toThrow();
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
        expect(api.indexSetup).toBeDefined();
        expect(typeof api.indexSetup).toEqual('function');
    });

    it('count returns total amount for query', (done) => {
        const query = { body: 'someQuery' };
        const api = esApi(client, logger);

        Promise.resolve(api.count(query))
            .then((results) => {
                expect(query).toEqual({ body: 'someQuery', size: 0 });
                expect(results).toEqual(0);
                total = 500;
                return api.count(query);
            })
            .then(results => expect(results).toEqual(500))
            .catch(fail)
            .finally(() => { done(); });
    });

    it('can search and return records', (done) => {
        const query = { body: 'someQuery' };
        const api = esApi(client, logger);
        const apiFullResponse = esApi(client, logger, { full_response: true });
        recordsReturned = [{ _id: 'someId', _type: 'someType', _source: { some: 'data' } }];

        Promise.all([api.search(query), apiFullResponse.search(query)])
            .spread((results1, results2) => {
                expect(results1).toEqual([recordsReturned[0]._source]);
                expect(results2).toEqual([{ _id: 'someId', _type: 'someType', some: 'data' }]);
            })
            .catch(fail)
            .finally(() => { done(); });
    });

    it('search can handle rejection errors', (done) => {
        const query = { body: 'someQuery' };
        const api = esApi(client, logger);
        let queryFailed = false;
        searchError = { body: { error: { type: 'es_rejected_execution_exception' } } };
        recordsReturned = [{ _source: { some: 'data' } }];

        Promise.all([api.search(query), waitFor(50, () => { searchError = false; })])
            .spread((results) => {
                expect(results).toEqual([recordsReturned[0]._source]);
                searchError = { body: { error: { type: 'some_thing_else' } } };
                return api.search(query)
                    .catch(() => { queryFailed = true; });
            })
            .then(() => expect(queryFailed).toEqual(true))
            .catch(fail)
            .finally(() => { done(); });
    });

    it('search can handle shard errors', (done) => {
        const query = { body: 'someQuery' };
        const api = esApi(client, logger);
        let queryFailed = false;
        failed = 3;
        failures = [{ reason: { type: 'es_rejected_execution_exception' } }];
        recordsReturned = [{ _source: { some: 'data' } }];

        Promise.all([
            api.search(query),
            waitFor(20, () => {
                failed = 0;
                failures = [];
            })
        ])
            .spread((results) => {
                expect(results).toEqual([recordsReturned[0]._source]);
                failed = 4;
                failures = [{ reason: { type: 'some other error' } }];
                return Promise.all([
                    api.search(query),
                    waitFor(50, () => {
                        failed = 0;
                        failures = [];
                    })
                ]).catch(() => { queryFailed = true; });
            })
            .then(() => expect(queryFailed).toEqual(true))
            .catch(fail)
            .finally(() => { done(); });
    });

    it('can call mget', (done) => {
        const query = { body: 'someQuery' };
        const api = esApi(client, logger);
        recordsReturned = [{ _source: { some: 'data' } }];

        Promise.resolve(api.mget(query))
            .then(results => expect(results).toEqual(getData()))
            .catch(fail)
            .finally(() => { done(); });
    });

    it('can call get', (done) => {
        const query = { body: 'someQuery' };
        const api = esApi(client, logger);
        recordsReturned = [{ _source: { some: 'data' } }];

        Promise.resolve(api.get(query))
            .then(results => expect(results).toEqual(recordsReturned[0]._source))
            .catch(fail)
            .finally(() => { done(); });
    });

    it('can call index', (done) => {
        const query = { index: 'someIndex', type: 'sometype', body: 'someQuery' };
        const api = esApi(client, logger);

        Promise.resolve(api.index(query))
            .then(results => expect(results.created).toEqual(true))
            .catch(fail)
            .finally(() => { done(); });
    });

    it('can call indexWithId', (done) => {
        const query = {
            index: 'someIndex', id: 'someId', type: 'sometype', body: 'someQuery'
        };
        const api = esApi(client, logger);
        recordsReturned = [{ _source: { some: 'data' } }];

        Promise.resolve(api.indexWithId(query))
            .then(results => expect(results).toEqual(query.body))
            .catch(fail)
            .finally(() => { done(); });
    });

    it('can call create', (done) => {
        const query = { index: 'someIndex', type: 'sometype', body: 'someQuery' };
        const api = esApi(client, logger);

        Promise.resolve(api.create(query))
            .then(results => expect(results).toEqual(query.body))
            .catch(fail)
            .finally(() => { done(); });
    });

    it('can call update', (done) => {
        const query = { index: 'someIndex', type: 'sometype', body: { doc: { some: 'data' } } };
        const api = esApi(client, logger);

        Promise.resolve(api.update(query))
            .then(results => expect(results).toEqual(query.body.doc))
            .catch(fail)
            .finally(() => { done(); });
    });

    it('can call remove', (done) => {
        const query = { index: 'someIndex', type: 'sometype', id: 'someId' };
        const api = esApi(client, logger);

        Promise.resolve(api.remove(query))
            .then(results => expect(results).toEqual(true))
            .catch(fail)
            .finally(() => { done(); });
    });

    it('can call indexExists', (done) => {
        const query = { index: 'someIndex' };
        const api = esApi(client, logger);

        Promise.resolve(api.indexExists(query))
            .then(results => expect(results).toEqual(true))
            .catch(fail)
            .finally(() => { done(); });
    });

    it('can call indexCreate', (done) => {
        const query = { index: 'someIndex' };
        const api = esApi(client, logger);

        Promise.resolve(api.indexCreate(query))
            .then(results => expect(results.acknowledged).toEqual(true))
            .catch(fail)
            .finally(() => { done(); });
    });

    it('can call indexRefresh', (done) => {
        const query = { index: 'someIndex' };
        const api = esApi(client, logger);

        Promise.resolve(api.indexRefresh(query))
            .then(results => expect(results).toBeTruthy())
            .catch(fail)
            .finally(() => { done(); });
    });

    it('can call indexRecovery', (done) => {
        const query = { index: 'someIndex' };
        const api = esApi(client, logger);

        Promise.resolve(api.indexRecovery(query))
            .then(results => expect(results[query.index]).toBeTruthy())
            .catch(fail)
            .finally(() => { done(); });
    });

    it('can call nodeInfo', (done) => {
        const api = esApi(client, logger);

        Promise.resolve(api.nodeInfo())
            .then(results => expect(results).toBeTruthy())
            .catch(fail)
            .finally(() => { done(); });
    });

    it('can call nodeStats', (done) => {
        const api = esApi(client, logger);

        Promise.resolve(api.nodeStats())
            .then(results => expect(results).toBeTruthy())
            .catch(fail)
            .finally(() => { done(); });
    });

    it('can call nodeStats', (done) => {
        const api = esApi(client, logger);

        Promise.resolve(api.nodeStats())
            .then(results => expect(results).toBeTruthy())
            .catch(fail)
            .finally(() => { done(); });
    });

    it('can warn window size with version', (done) => {
        const api = esApi(client, logger, { index: 'some_index' });

        Promise.resolve(api.version())
            .then(() => expect(warnMsg).toBeTruthy())
            .catch(fail)
            .finally(() => { done(); });
    });

    it('can call putTemplate', (done) => {
        const api = esApi(client, logger);

        Promise.resolve(api.putTemplate(template, 'somename'))
            .then(results => expect(results.acknowledged).toEqual(true))
            .catch(fail)
            .finally(() => { done(); });
    });

    it('can call bulkSend', (done) => {
        const api = esApi(client, logger);
        const myBulkData = [
            { index: { _index: 'some_index', _type: 'events', _id: 1 } },
            { title: 'foo' },
            { delete: { _index: 'some_index', _type: 'events', _id: 5 } }
        ];

        Promise.resolve(api.bulkSend(myBulkData))
            .then(results => expect(results).toBeTruthy())
            .catch(fail)
            .finally(() => { done(); });
    });

    it('can call bulkSend with errors', (done) => {
        const api = esApi(client, logger);
        const myBulkData = [
            { index: { _index: 'some_index', _type: 'events', _id: 1 } },
            { title: 'foo' },
            { delete: { _index: 'some_index', _type: 'events', _id: 5 } }
        ];
        bulkError = ['es_rejected_execution_exception', 'es_rejected_execution_exception', 'es_rejected_execution_exception'];
        let queryFailed = false;

        Promise.all([api.bulkSend(myBulkData), waitFor(20, () => { bulkError = false; })])
            .spread((results) => {
                expect(results).toBeTruthy();
                bulkError = ['some_thing_else', 'some_thing_else', 'some_thing_else'];
                return Promise.all([
                    api.bulkSend(myBulkData),
                    waitFor(20, () => { bulkError = false; })
                ]).catch((err) => {
                    queryFailed = true;
                    expect(err).toEqual('some_thing_else--someReason');
                });
            })
            .then(() => expect(queryFailed).toEqual(true))
            .catch(fail)
            .finally(() => { done(); });
    });

    it('can call buildQuery for geo queries', () => {
        const api = esApi(client, logger);

        const badOpConfig1 = {
            index: 'some_index',
            geo_field: 'some_field'
        };
        const badOpConfig2 = {
            index: 'some_index',
            geo_field: 'some_field',
            geo_box_top_left: '34.5234,79.42345'
        };
        const badOpConfig3 = {
            index: 'some_index',
            geo_field: 'some_field',
            geo_box_bottom_right: '54.5234,80.3456'
        };
        const badOpConfig4 = {
            index: 'some_index',
            geo_field: 'some_field',
            geo_point: '67.2435,100.2345'
        };
        const badOpConfig5 = {
            index: 'some_index',
            geo_field: 'some_field',
            geo_distance: '200km'
        };
        const badOpConfig6 = {
            index: 'some_index',
            geo_field: 'some_field',
            geo_box_top_left: '34.5234,79.42345',
            geo_point: '67.2435,100.2345'
        };
        const badOpConfig7 = {
            index: 'some_index',
            geo_field: 'some_field',
            geo_box_top_left: '34.5234,79.42345',
            geo_box_bottom_right: '54.5234,80.3456',
            geo_sort_unit: 'm'
        };
        const badOpConfig8 = {
            index: 'some_index',
            geo_field: 'some_field',
            geo_box_top_left: '34.5234,79.42345',
            geo_box_bottom_right: '54.5234,80.3456',
            geo_sort_order: 'asc'
        };


        const goodConfig1 = {
            index: 'some_index',
            geo_field: 'some_field',
            geo_box_top_left: '34.5234,79.42345',
            geo_box_bottom_right: '54.5234,80.3456'
        };
        const goodConfig2 = {
            index: 'some_index',
            date_field_name: 'created',
            geo_field: 'some_field',
            geo_box_top_left: '34.5234,79.42345',
            geo_box_bottom_right: '54.5234,80.3456',
            geo_sort_point: '52.3456,79.6784'
        };
        const goodConfig3 = {
            index: 'some_index',
            geo_field: 'some_field',
            geo_distance: '200km',
            geo_point: '67.2435,100.2345'
        };
        const goodConfig4 = {
            index: 'some_index',
            geo_field: 'some_field',
            geo_distance: '200km',
            geo_point: '67.2435,100.2345',
            geo_sort_point: '52.3456,79.6784',
            geo_sort_unit: 'km',
            geo_sort_order: 'desc'
        };

        const msg1 = { count: 100 };
        const msg2 = { count: 100, start: new Date(), end: new Date() };

        function makeResponse(opConfig, msg, data, sort) {
            const query = {
                index: opConfig.index,
                size: msg.count,
                body: {
                    query: {
                        bool: {
                            must: Array.isArray(data) ? data : [data]
                        }
                    }
                }
            };
            if (opConfig.fields) {
                query._source = opConfig.fields;
            }
            if (sort) query.body.sort = [sort];
            return query;
        }

        const response1 = {
            geo_bounding_box: {
                some_field: {
                    top_left: {
                        lat: '34.5234',
                        lon: '79.42345'
                    },
                    bottom_right: {
                        lat: '54.5234',
                        lon: '80.3456'
                    }
                }
            }
        };
        const sort1 = {
            _geo_distance: {
                some_field: {
                    lat: '52.3456',
                    lon: '79.6784'
                },
                order: 'asc',
                unit: 'm'
            }
        };
        const response2 = {
            geo_distance: {
                distance: '200km',
                some_field: {
                    lat: '67.2435',
                    lon: '100.2345'
                }
            }
        };
        const sort2 = {
            _geo_distance: {
                some_field: {
                    lat: '67.2435',
                    lon: '100.2345'
                },
                order: 'asc',
                unit: 'm'
            }
        };

        const sort3 = {
            _geo_distance: {
                some_field: {
                    lat: '52.3456',
                    lon: '79.6784'
                },
                order: 'desc',
                unit: 'km'
            }
        };
        const response3 = [
            {
                range: {
                    created: {
                        gte: msg2.start,
                        lt: msg2.end
                    }
                }
            },
            {
                geo_bounding_box: {
                    some_field: {
                        top_left: {
                            lat: '34.5234',
                            lon: '79.42345'
                        },
                        bottom_right: {
                            lat: '54.5234',
                            lon: '80.3456'
                        }
                    }
                }
            }];

        const finalResponse1 = makeResponse(goodConfig1, msg1, response1);
        const finalResponse2 = makeResponse(goodConfig2, msg1, response1, sort1);
        const finalResponse3 = makeResponse(goodConfig3, msg1, response2, sort2);
        const finalResponse4 = makeResponse(goodConfig4, msg1, response2, sort3);
        const finalResponse5 = makeResponse(goodConfig2, msg2, response3, sort1);

        expect(() => api.buildQuery(badOpConfig1, msg1)).toThrowError('if geo_field is specified then the appropriate geo_box or geo_distance query parameters need to be provided as well');
        expect(() => api.buildQuery(badOpConfig2, msg1)).toThrowError('Both geo_box_top_left and geo_box_bottom_right must be provided for a geo bounding box query.');
        expect(() => api.buildQuery(badOpConfig3, msg1)).toThrowError('Both geo_box_top_left and geo_box_bottom_right must be provided for a geo bounding box query.');
        expect(() => api.buildQuery(badOpConfig4, msg1)).toThrowError('Both geo_point and geo_distance must be provided for a geo_point query.');
        expect(() => api.buildQuery(badOpConfig5, msg1)).toThrowError('Both geo_point and geo_distance must be provided for a geo_point query.');
        expect(() => api.buildQuery(badOpConfig6, msg1)).toThrowError('geo_box and geo_distance queries can not be combined.');
        expect(() => api.buildQuery(badOpConfig7, msg1)).toThrowError('bounding box search requires geo_sort_point to be set if any other geo_sort_* parameter is provided');
        expect(() => api.buildQuery(badOpConfig8, msg1)).toThrowError('bounding box search requires geo_sort_point to be set if any other geo_sort_* parameter is provided');

        expect(api.buildQuery(goodConfig1, msg1)).toEqual(finalResponse1);
        expect(api.buildQuery(goodConfig2, msg1)).toEqual(finalResponse2);
        expect(api.buildQuery(goodConfig3, msg1)).toEqual(finalResponse3);
        expect(api.buildQuery(goodConfig4, msg1)).toEqual(finalResponse4);

        expect(api.buildQuery(goodConfig2, msg2)).toEqual(finalResponse5);
    });

    it('can call buildQuery for elastic queries', () => {
        const api = esApi(client, logger);
        const opConfig1 = { index: 'some_index' };
        const opConfig2 = { index: 'some_index', date_field_name: 'created' };
        const opConfig3 = { index: 'some_index', query: 'someLucene:query' };
        const opConfig4 = { index: 'some_index', query: 'someLucene:query', fields: ['field1', 'field2'] };

        const msg1 = { count: 100, key: 'someKey' };
        const msg2 = { count: 100, start: new Date(), end: new Date() };
        const msg3 = { count: 100 };

        function makeResponse(opConfig, msg, data) {
            const query = {
                index: opConfig.index,
                size: msg.count,
                body: {
                    query: {
                        bool: {
                            must: Array.isArray(data) ? data : [data]
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
    });

    it('can set up an index', (done) => {
        const api = esApi(client, logger);
        const clusterName = 'teracluster';
        const newIndex = 'teracluster__state';
        const migrantIndexName = 'teracluster__state-v0.0.33';
        const recordType = 'state';
        const clientName = 'default';

        api.indexSetup(clusterName, newIndex, migrantIndexName, template, recordType, clientName)
            .catch(fail)
            .finally(() => { done(); });
    });

    it('can set up an index and wait for availability', (done) => {
        const api = esApi(client, logger);
        const clusterName = 'teracluster';
        const newIndex = 'teracluster__state';
        const migrantIndexName = 'teracluster__state-v0.0.33';
        const recordType = 'state';
        const clientName = 'default';

        searchError = true;

        Promise.all([
            waitFor(300, () => { searchError = false; }),
            api.indexSetup(
                clusterName,
                newIndex,
                migrantIndexName,
                template,
                recordType,
                clientName
            )
        ])
            .catch(fail)
            .finally(() => { done(); });
    });

    it('can wait for elasticsearch availability', (done) => {
        const api = esApi(client, logger);
        const clusterName = 'teracluster';
        const newIndex = 'teracluster__state';
        const migrantIndexName = 'teracluster__state-v0.0.33';
        const recordType = 'state';
        const clientName = 'default';
        // this mimics an index not available to be searched as its not ready
        elasticDown = true;
        recoverError = true;

        Promise.all([
            api.indexSetup(
                clusterName,
                newIndex,
                migrantIndexName,
                template,
                recordType,
                clientName,
                1000
            ),
            waitFor(1, () => { elasticDown = false; }),
            waitFor(1200, () => { recoverError = false; }),
        ])
            .catch(fail)
            .finally(() => { done(); });
    });

    it('can send template on state mapping changes, does not migrate', (done) => {
        const api = esApi(client, logger);
        const clusterName = 'teracluster';
        const newIndex = 'teracluster__state';
        const migrantIndexName = 'teracluster__state-v0.0.33';
        const recordType = 'state';
        const clientName = 'default';

        changeMappings = true;

        api.indexSetup(clusterName, newIndex, migrantIndexName, template, recordType, clientName)
            .then(() => {
                expect(putTemplateCalled).toEqual(true);
                expect(reindexCalled).toEqual(false);
            })
            .catch(fail)
            .finally(() => { done(); });
    });

    it('can migrate on mapping changes', (done) => {
        const api = esApi(client, logger);
        const clusterName = 'teracluster';
        const newIndex = 'teracluster__ex';
        const migrantIndexName = 'teracluster__ex-v0.0.33';
        const recordType = 'ex';
        const clientName = 'default';

        changeMappings = true;
        isExecutionTemplate = true;

        api.indexSetup(clusterName, newIndex, migrantIndexName, template, recordType, clientName)
            .then(() => {
                expect(reindexCalled).toEqual(true);
                expect(indicesDeleteCalled).toEqual(true);
                expect(indicesPutAliasCalled).toEqual(true);
            })
            .catch(fail)
            .finally(() => { done(); });
    });
});
