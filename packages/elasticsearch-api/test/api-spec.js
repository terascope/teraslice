'use strict';

const Promise = require('bluebird');
const { debugLogger } = require('@terascope/utils');
const esApi = require('..');

describe('elasticsearch-api', () => {
    let recordsReturned = [];
    let searchQuery; // eslint-disable-line
    let failed = 0;
    let failures = [];
    let total = 0;
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
        return new Promise((resolve) => setTimeout(() => {
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
        obj[index] = {
            shards: [{ shard: 1, primary: true, stage: recoverError ? 'notdone' : 'DONE' }]
        };
        return obj;
    }

    function createBulkResponse(results) {
        const response = { took: 22, errors: false, items: results };
        if (bulkError) {
            response.errors = true;
            response.items = results.body.map((obj, index) => {
                Object.entries(obj).forEach(([key, value]) => {
                    obj[key] = Object.assign(value, {
                        error: { type: bulkError[index] || 'someType', reason: 'someReason' }
                    });
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
        // set this so we can verify the index
        transport: {
            closed: false,
            requestTimeout: 50,
            connectionPool: {
                _conns: {
                    alive: [{}],
                    dead: [{}]
                }
            }
        },
        mget: () => Promise.resolve(getData()),
        get: () => Promise.resolve(recordsReturned[0]),
        index: () => Promise.resolve(postedData('created')),
        create: (obj) => Promise.resolve(postedData('created', obj.id)),
        update: () => Promise.resolve(postedData('updated')),
        delete: () => Promise.resolve(postedData('deleted')),
        bulk: (data) => Promise.resolve(createBulkResponse(data)),
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
                if (elasticDown) return Promise.reject(new Error('Elasticsearch is down'));
                return Promise.resolve(indexAlreadyExists);
            },
            create: () => Promise.resolve({ acknowledged: true, shards_acknowledged: true }),
            refresh: () => Promise.resolve({ _shards: { total: 10, successful: 5, failed: 0 } }),
            recovery: (query) => Promise.resolve(getRecoveryData(query.index)),
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

    const logger = debugLogger('elasticsearch-api');

    it('can instantiate', () => {
        let api;
        expect(() => {
            api = esApi(client, logger);
        }).not.toThrow();
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

    it('count returns total amount for query', async () => {
        const query = { body: 'someQuery' };
        const api = esApi(client, logger);

        const results = await api.count(query);
        expect(query).toEqual({ body: 'someQuery', size: 0 });
        expect(results).toEqual(0);
        total = 500;
        return expect(api.count(query)).resolves.toEqual(500);
    });

    it('can search', async () => {
        const query = { body: 'someQuery' };
        const api = esApi(client, logger);
        const apiFullResponse = esApi(client, logger, { full_response: true });
        recordsReturned = [{ _source: { some: 'data' } }];

        const [results1, results2] = await Promise.all([
            api.search(query),
            apiFullResponse.search(query)
        ]);
        expect(results1).toEqual([recordsReturned[0]._source]);
        expect(results2).toEqual(getData());
    });

    it('search can handle rejection errors', async () => {
        const query = { body: 'someQuery' };
        const api = esApi(client, logger);
        let queryFailed = false;
        searchError = { body: { error: { type: 'es_rejected_execution_exception' } } };
        recordsReturned = [{ _source: { some: 'data' } }];

        const [results] = await Promise.all([
            api.search(query),
            waitFor(50, () => {
                searchError = false;
            })
        ]);
        expect(results).toEqual([recordsReturned[0]._source]);
        searchError = { body: { error: { type: 'some_thing_else' } } };
        try {
            await api.search(query);
        } catch (e) {
            queryFailed = true;
        }
        return expect(queryFailed).toEqual(true);
    });

    it('search can handle shard errors', async () => {
        const query = { body: 'someQuery' };
        const api = esApi(client, logger);
        let queryFailed = false;
        failed = 3;
        failures = [{ reason: { type: 'es_rejected_execution_exception' } }];
        recordsReturned = [{ _source: { some: 'data' } }];

        const [results] = await Promise.all([
            api.search(query),
            waitFor(20, () => {
                failed = 0;
                failures = [];
            })
        ]);
        expect(results).toEqual([recordsReturned[0]._source]);
        failed = 4;
        failures = [{ reason: { type: 'some other error' } }];
        try {
            await Promise.all([
                api.search(query),
                waitFor(50, () => {
                    failed = 0;
                    failures = [];
                })
            ]);
        } catch (e) {
            queryFailed = true;
        }
        return expect(queryFailed).toEqual(true);
    });

    it('can call mget', async () => {
        const query = { body: 'someQuery' };
        const api = esApi(client, logger);
        recordsReturned = [{ _source: { some: 'data' } }];

        const results = await api.mget(query);
        return expect(results).toEqual(getData());
    });

    it('can call get', async () => {
        const query = { body: 'someQuery' };
        const api = esApi(client, logger);
        recordsReturned = [{ _source: { some: 'data' } }];

        const results = await api.get(query);
        return expect(results).toEqual(recordsReturned[0]._source);
    });

    it('can call index', async () => {
        const query = { index: 'someIndex', type: 'sometype', body: 'someQuery' };
        const api = esApi(client, logger);

        const results = await api.index(query);
        return expect(results.created).toEqual(true);
    });

    it('can call indexWithId', async () => {
        const query = {
            index: 'someIndex',
            id: 'someId',
            type: 'sometype',
            body: 'someQuery'
        };
        const api = esApi(client, logger);
        recordsReturned = [{ _source: { some: 'data' } }];

        const results = await api.indexWithId(query);
        return expect(results).toEqual(query.body);
    });

    it('can call create', async () => {
        const query = { index: 'someIndex', type: 'sometype', body: 'someQuery' };
        const api = esApi(client, logger);

        const results = await api.create(query);
        return expect(results).toEqual(query.body);
    });

    it('can call update', async () => {
        const query = { index: 'someIndex', type: 'sometype', body: { doc: { some: 'data' } } };
        const api = esApi(client, logger);

        const results = await api.update(query);
        return expect(results).toEqual(query.body.doc);
    });

    it('can call remove', async () => {
        const query = { index: 'someIndex', type: 'sometype', id: 'someId' };
        const api = esApi(client, logger);

        const results = await api.remove(query);
        return expect(results).toEqual(true);
    });

    it('can call indexExists', async () => {
        const query = { index: 'someIndex' };
        const api = esApi(client, logger);

        const results = await api.indexExists(query);
        return expect(results).toEqual(true);
    });

    it('can call indexCreate', async () => {
        const query = { index: 'someIndex', body: { mappings: {} } };
        const api = esApi(client, logger);

        const results = await api.indexCreate(query);
        return expect(results.acknowledged).toEqual(true);
    });

    it('can call indexRefresh', async () => {
        const query = { index: 'someIndex' };
        const api = esApi(client, logger);

        const results = await api.indexRefresh(query);
        return expect(results).toBeTruthy();
    });

    it('can call indexRecovery', async () => {
        const query = { index: 'someIndex' };
        const api = esApi(client, logger);

        const results = await api.indexRecovery(query);
        return expect(results[query.index]).toBeTruthy();
    });

    it('can call nodeInfo', async () => {
        const api = esApi(client, logger);

        const results = await api.nodeInfo();
        return expect(results).toBeTruthy();
    });

    it('can call nodeStats', async () => {
        const api = esApi(client, logger);

        const results = await api.nodeStats();
        return expect(results).toBeTruthy();
    });

    it('can warn window size with version', () => {
        const api = esApi(client, logger, { index: 'some_index' });

        return api.version();
    });

    it('can call putTemplate', async () => {
        const api = esApi(client, logger);

        const results = await api.putTemplate(template, 'somename');
        return expect(results.acknowledged).toEqual(true);
    });

    it('can call bulkSend', async () => {
        const api = esApi(client, logger);
        const myBulkData = [
            { index: { _index: 'some_index', _type: 'events', _id: 1 } },
            { title: 'foo' },
            { delete: { _index: 'some_index', _type: 'events', _id: 5 } }
        ];

        const results = await api.bulkSend(myBulkData);
        return expect(results).toBeTruthy();
    });

    it('can call bulkSend with errors', async () => {
        const api = esApi(client, logger);
        const myBulkData = [
            { index: { _index: 'some_index', _type: 'events', _id: 1 } },
            { title: 'foo' },
            { delete: { _index: 'some_index', _type: 'events', _id: 5 } }
        ];

        bulkError = [
            'es_rejected_execution_exception',
            'es_rejected_execution_exception',
            'es_rejected_execution_exception'
        ];

        const [results] = await Promise.all([
            api.bulkSend(myBulkData),
            waitFor(20, () => {
                bulkError = false;
            })
        ]);

        expect(results).toBeTruthy();
        bulkError = ['some_thing_else', 'some_thing_else', 'some_thing_else'];

        return expect(
            Promise.all([
                api.bulkSend(myBulkData),
                waitFor(20, () => {
                    bulkError = false;
                })
            ])
        ).rejects.toThrow(/some_thing_else--someReason/);
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
            }
        ];

        const finalResponse1 = makeResponse(goodConfig1, msg1, response1);
        const finalResponse2 = makeResponse(goodConfig2, msg1, response1, sort1);
        const finalResponse3 = makeResponse(goodConfig3, msg1, response2, sort2);
        const finalResponse4 = makeResponse(goodConfig4, msg1, response2, sort3);
        const finalResponse5 = makeResponse(goodConfig2, msg2, response3, sort1);

        expect(() => api.buildQuery(badOpConfig1, msg1)).toThrowError(
            'if geo_field is specified then the appropriate geo_box or geo_distance query parameters need to be provided as well'
        );
        expect(() => api.buildQuery(badOpConfig2, msg1)).toThrowError(
            'Both geo_box_top_left and geo_box_bottom_right must be provided for a geo bounding box query.'
        );
        expect(() => api.buildQuery(badOpConfig3, msg1)).toThrowError(
            'Both geo_box_top_left and geo_box_bottom_right must be provided for a geo bounding box query.'
        );
        expect(() => api.buildQuery(badOpConfig4, msg1)).toThrowError(
            'Both geo_point and geo_distance must be provided for a geo_point query.'
        );
        expect(() => api.buildQuery(badOpConfig5, msg1)).toThrowError(
            'Both geo_point and geo_distance must be provided for a geo_point query.'
        );
        expect(() => api.buildQuery(badOpConfig6, msg1)).toThrowError(
            'geo_box and geo_distance queries can not be combined.'
        );
        expect(() => api.buildQuery(badOpConfig7, msg1)).toThrowError(
            'bounding box search requires geo_sort_point to be set if any other geo_sort_* parameter is provided'
        );
        expect(() => api.buildQuery(badOpConfig8, msg1)).toThrowError(
            'bounding box search requires geo_sort_point to be set if any other geo_sort_* parameter is provided'
        );

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
        const opConfig4 = {
            index: 'some_index',
            query: 'someLucene:query',
            fields: ['field1', 'field2']
        };
        const field = 'someField';
        const msg1 = { count: 100, key: 'someKey' };
        const msg2 = { count: 100, start: new Date(), end: new Date() };
        const msg3 = { count: 100 };
        const msg4 = { count: 100, wildcard: { field, value: 'someKey' } };

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
        const response4 = [
            { wildcard: { _uid: 'someKey' } },
            { query_string: { query: opConfig3.query } }
        ];
        const response5 = [
            { wildcard: { [field]: 'someKey' } },
            { query_string: { query: opConfig3.query } }
        ];

        expect(api.buildQuery(opConfig1, msg1)).toEqual(makeResponse(opConfig1, msg1, response1));
        expect(api.buildQuery(opConfig2, msg2)).toEqual(makeResponse(opConfig2, msg2, response2));
        expect(api.buildQuery(opConfig3, msg3)).toEqual(makeResponse(opConfig3, msg3, response3));
        expect(api.buildQuery(opConfig4, msg3)).toEqual(makeResponse(opConfig4, msg3, response3));
        expect(api.buildQuery(opConfig3, msg1)).toEqual(makeResponse(opConfig3, msg1, response4));
        expect(api.buildQuery(opConfig3, msg4)).toEqual(makeResponse(opConfig3, msg1, response5));
    });

    it('can set up an index', () => {
        const api = esApi(client, logger);
        const clusterName = 'teracluster';
        const newIndex = 'teracluster__state';
        const migrantIndexName = 'teracluster__state-v0.0.33';
        const recordType = 'state';
        const clientName = 'default';

        return api.indexSetup(
            clusterName,
            newIndex,
            migrantIndexName,
            template,
            recordType,
            clientName
        );
    });

    it('can set up an index and wait for availability', () => {
        const api = esApi(client, logger);
        const clusterName = 'teracluster';
        const newIndex = 'teracluster__state';
        const migrantIndexName = 'teracluster__state-v0.0.33';
        const recordType = 'state';
        const clientName = 'default';

        searchError = true;

        return Promise.all([
            waitFor(300, () => {
                searchError = false;
            }),
            api.indexSetup(
                clusterName,
                newIndex,
                migrantIndexName,
                template,
                recordType,
                clientName
            )
        ]);
    });

    it('can wait for elasticsearch availability', () => {
        const api = esApi(client, logger);
        const clusterName = 'teracluster';
        const newIndex = 'teracluster__state';
        const migrantIndexName = 'teracluster__state-v0.0.33';
        const recordType = 'state';
        const clientName = 'default';
        // this mimics an index not available to be searched as its not ready
        elasticDown = true;
        recoverError = true;

        return Promise.all([
            api.indexSetup(
                clusterName,
                newIndex,
                migrantIndexName,
                template,
                recordType,
                clientName,
                1000
            ),
            waitFor(1, () => {
                elasticDown = false;
            }),
            waitFor(1200, () => {
                recoverError = false;
            })
        ]);
    });

    it('can send template on state mapping changes, does not migrate', async () => {
        const api = esApi(client, logger);
        const clusterName = 'teracluster';
        const newIndex = 'teracluster__state';
        const migrantIndexName = 'teracluster__state-v0.0.33';
        const recordType = 'state';
        const clientName = 'default';

        changeMappings = true;

        await api.indexSetup(
            clusterName,
            newIndex,
            migrantIndexName,
            template,
            recordType,
            clientName
        );
        expect(putTemplateCalled).toEqual(true);
        expect(reindexCalled).toEqual(false);
    });

    it('can migrate on mapping changes', async () => {
        const api = esApi(client, logger);
        const clusterName = 'teracluster';
        const newIndex = 'teracluster__ex';
        const migrantIndexName = 'teracluster__ex-v0.0.33';
        const recordType = 'ex';
        const clientName = 'default';

        changeMappings = true;
        isExecutionTemplate = true;

        await api.indexSetup(
            clusterName,
            newIndex,
            migrantIndexName,
            template,
            recordType,
            clientName
        );
        expect(reindexCalled).toEqual(true);
        expect(indicesDeleteCalled).toEqual(true);
        expect(indicesPutAliasCalled).toEqual(true);
    });
});
