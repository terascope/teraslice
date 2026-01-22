import {
    debugLogger, cloneDeep, isEmpty,
    pDelay, unset, DataEntity
} from '@terascope/core-utils';

import esApi from '../src/index.js';

describe('elasticsearch-api', () => {
    let recordsReturned: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let mgetQuery: any;
    let bulkData: any;
    let searchQuery: any;
    let indexQuery: any;
    let createQuery: any;
    let updateQuery: any;
    let removeQuery: any;
    let failed = 0;
    let failures: any[] = [];
    let total = 0;
    let bulkError: any | any[] = false;
    let searchError: any = false;
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

    function getMGetData() {
        return {
            docs: recordsReturned
        };
    }

    async function waitFor(time: number, fn: any) {
        await pDelay(time);
        if (fn) {
            fn();
        }
        return true;
    }

    function postedData(action: string, id?: string) {
        const result: Record<string, any> = {
            _index: 'bigdata7',
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
    };

    const template2 = {
        template: 'test*',
        settings: {
            'index.number_of_shards': 5,
            'index.number_of_replicas': 1
        },
        mappings: {
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
    };

    function getRecoveryData(index: string) {
        const obj: Record<string, any> = {};
        obj[index] = {
            shards: [{ shard: 1, primary: true, stage: recoverError ? 'notdone' : 'DONE' }]
        };
        return obj;
    }

    function createBulkResponse(results: Record<string, any>[]) {
        const response: Record<string, any> = { took: 22, errors: false, items: results };
        if (!isEmpty(bulkError)) {
            response.errors = true;
            let i = -1;
            // @ts-expect-error
            response.items = results.body.flatMap((obj: Record<string, any>) => {
                if (!obj.index && !obj.update && !obj.create && !obj.delete) {
                    // ignore the non-metadata objects
                    return [];
                }
                i++;
                const [key, value] = Object.entries(obj)[0];
                return [{
                    [key]: {
                        _index: value._index,
                        _id: String(i),
                        _version: 1,
                        result: `${key}d`,
                        error: { type: bulkError[i] || 'someType', reason: 'someReason' },
                        _shards: {
                            total: 2,
                            successful: 1,
                            failed: 0
                        },
                        status: 400,
                        _seq_no: 2,
                        _primary_term: 3
                    }
                }];
            });
        } else {
            response.errors = false;
            let i = -1;
            // @ts-expect-error
            response.items = results.body.flatMap((obj: Record<string, any>) => {
                if (!obj.index && !obj.update && !obj.create && !obj.delete) {
                    // ignore the non-metadata objects
                    return [];
                }

                i++;
                const [key, value] = Object.entries(obj)[0];
                return [{
                    [key]: {
                        _index: value._index,
                        _id: String(i),
                        _version: 1,
                        result: `${key}d`,
                        _shards: {
                            total: 2,
                            successful: 1,
                            failed: 0
                        },
                        status: 200,
                        _seq_no: 2,
                        _primary_term: 3
                    }
                }];
            });
        }
        return response;
    }

    function simulateTemplateResponse(
        originalMapping: Record<string, any>,
        index: string,
    ) {
        const results: Record<string, any> = {};
        results[index] = { mappings: JSON.parse(JSON.stringify(originalMapping.mappings)) };
        // simulate the 'false' to false issue
        results[index].mappings.dynamic = 'false';
        if (changeMappings) {
            results[index].mappings.properties.newKey = { type: 'keyword' };
        }

        return results;
    }

    const logger = debugLogger('elasticsearch-api-spec');
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
        mget: (query: Record<string, any>) => {
            mgetQuery = query;
            return Promise.resolve(getMGetData());
        },
        // let getQuery;
        // let indexQuery;
        // let createQuery;
        // let updateQuery;
        // let deleteQuery;
        get: () => Promise.resolve(recordsReturned[0]),
        index: (query: Record<string, any>) => {
            indexQuery = query;
            return Promise.resolve(postedData('created'));
        },
        create: (obj: Record<string, any>) => {
            createQuery = obj;
            return Promise.resolve(postedData('created', obj.id));
        },
        update: (query: Record<string, any>) => {
            updateQuery = query;
            return Promise.resolve(postedData('updated'));
        },
        delete: (query: Record<string, any>) => {
            removeQuery = query;
            return Promise.resolve(postedData('deleted'));
        },
        bulk: (data: Record<string, any>[]) => {
            bulkData = data;
            return Promise.resolve(createBulkResponse(data));
        },
        search: (_query: Record<string, any>) => {
            searchQuery = _query;
            logger.debug(searchQuery);
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
            recovery: (query: Record<string, any>) => Promise.resolve(getRecoveryData(query.index)),
            getSettings: () => {
                const obj: Record<string, any> = {};
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
                let templateArg: Record<string, any> = template;
                if (isExecutionTemplate) {
                    index = 'teracluster__ex';
                    templateArg = template2;
                    indexAlreadyExists = false;
                }
                return Promise.resolve(simulateTemplateResponse(templateArg, index));
            }
        },
        nodes: {
            info: () => Promise.resolve({ _nodes: {} }),
            stats: () => Promise.resolve({ _nodes: {} })
        },
        cluster: {
            stats: () => Promise.resolve({ nodes: { versions: ['6.8.1'] } })
        },
        __testing: {
            start: 100,
            limit: 500
        }
    } as any;

    it('can instantiate', () => {
        const api = esApi(client, logger);

        expect(typeof api).toEqual('object');
        expect(typeof api.search).toEqual('function');
        expect(typeof api.count).toEqual('function');
        expect(typeof api.get).toEqual('function');
        expect(typeof api.index).toEqual('function');
        expect(typeof api.indexWithId).toEqual('function');
        expect(typeof api.create).toEqual('function');
        expect(typeof api.update).toEqual('function');
        expect(typeof api.remove).toEqual('function');
        expect(typeof api.version).toEqual('function');
        expect(typeof api.putTemplate).toEqual('function');
        expect(typeof api.bulkSend).toEqual('function');
        expect(typeof api.nodeInfo).toEqual('function');
        expect(typeof api.nodeStats).toEqual('function');
        expect(typeof api.buildQuery).toEqual('function');
        expect(typeof api.indexExists).toEqual('function');
        expect(typeof api.indexCreate).toEqual('function');
        expect(typeof api.indexRefresh).toEqual('function');
        expect(typeof api.indexRecovery).toEqual('function');
        expect(typeof api.indexSetup).toEqual('function');
    });

    it('count returns total amount for query', async () => {
        const query = { body: 'someQuery' } as any;
        const api = esApi(client, logger);

        const results = await api.count(query);

        expect(results).toEqual(0);
        total = 500;
        return expect(api.count(query)).resolves.toEqual(500);
    });

    it('can search', async () => {
        const query = { body: 'someQuery' } as any;
        const api = esApi(client, logger);
        const apiFullResponse = esApi(client, logger, { full_response: true });
        recordsReturned = [{ _source: { some: 'data' } }];

        const [results1, results2] = await Promise.all([
            api.search(query),
            apiFullResponse.search(query)
        ]);

        expect(results1).toEqual([recordsReturned[0]._source]);
        expect(results1).toEqual([{ some: 'data' }]);
        // @ts-expect-error
        expect(DataEntity.isDataEntity(results1[0])).toEqual(true);
        expect(results2).toEqual(getData());
    });

    it('search can handle rejection errors', async () => {
        const query = { body: 'someQuery' } as any;
        const api = esApi(client, logger);
        let queryFailed = false;
        searchError = { body: { error: { type: 'es_rejected_execution_exception' } } } as any;
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
        } catch (_err) {
            queryFailed = true;
        }
        return expect(queryFailed).toEqual(true);
    });

    it('search can handle rejection errors of later opensearch queue errors', async () => {
        const query = { body: 'someQuery' } as any;
        const api = esApi(client, logger);
        let queryFailed = false;
        searchError = { body: { error: { type: 'rejected_execution_exception' } } } as any;
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
        } catch (_err) {
            queryFailed = true;
        }
        return expect(queryFailed).toEqual(true);
    });

    it('search can handle shard errors', async () => {
        const query = { body: 'someQuery' } as any;
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
        } catch (_err) {
            queryFailed = true;
        }
        return expect(queryFailed).toEqual(true);
    });

    it('can call mget', async () => {
        const query = {
            index: 'someIndex',

            body: { ids: ['id1', 'id2'] }
        };

        const api = esApi(client, logger);

        recordsReturned = [
            {
                _index: 'someIndex',
                _id: 'id1',
                found: true,
                _source: { some: 'data' }
            },
            {
                found: false,
                _source: { some: 'notFounddata' }
            }
        ];

        const results = await api.mget(query);

        expect(results.length).toEqual(1);
        expect(results).toEqual([{ some: 'data' }]);
        expect(DataEntity.isDataEntity(results[0])).toEqual(true);
        expect(results[0].getMetadata()).toMatchObject({ _index: 'someIndex', _key: 'id1' });
    });

    it('can call get', async () => {
        const query = { body: 'someQuery' } as any;
        const api = esApi(client, logger);
        recordsReturned = [{ _source: { some: 'data' } }];

        const results = await api.get(query);
        expect(results).toEqual({ some: 'data' });
        expect(DataEntity.isDataEntity(results)).toEqual(true);
    });

    it('can call index', async () => {
        const query = { index: 'someIndex', body: 'someQuery' };
        const api = esApi(client, logger);

        const results = await api.index(query) as any;
        return expect(results.created).toEqual(true);
    });

    it('removes types in index request for es7', async () => {
        const query = { index: 'someIndex', body: 'someQuery' };

        const es7client = cloneDeep(client);

        es7client.transport._config = { apiVersion: '7.0' };

        const api = await esApi(es7client, logger);

        await api.index(query);

        expect(indexQuery).toEqual({ index: 'someIndex', body: 'someQuery' });
    });

    it('can call indexWithId', async () => {
        const query = {
            index: 'someIndex',
            id: 'someId',
            body: 'someQuery'
        };
        const api = esApi(client, logger);
        recordsReturned = [{ _source: { some: 'data' } }];

        const results = await api.indexWithId(query);
        return expect(results).toEqual(query.body);
    });

    it('can remove type from indexWithId for es7', async () => {
        const query = {
            index: 'someIndex',
            id: 'someId',

            body: 'someQuery'
        };

        const es7client = cloneDeep(client);
        es7client.transport._config = { apiVersion: '7.0' };
        const api = esApi(es7client, logger);

        recordsReturned = [{ _source: { some: 'data' } }];

        await api.indexWithId(query);

        expect(indexQuery).toEqual({
            index: 'someIndex',
            id: 'someId',
            body: 'someQuery'
        });
    });

    it('can call create', async () => {
        const query = { index: 'someIndex', body: 'someQuery' } as any;
        const api = esApi(client, logger);

        const results = await api.create(query);
        return expect(results).toEqual(query.body);
    });

    it('can remove type from create request for es7', async () => {
        const query = { index: 'someIndex', body: 'someQuery' } as any;

        const es7client = cloneDeep(client);
        es7client.transport._config = { apiVersion: '7.0' };
        const api = esApi(es7client, logger);

        await api.create(query);

        expect(createQuery).toEqual({ index: 'someIndex', body: 'someQuery' });
    });

    it('can call update', async () => {
        const query = { index: 'someIndex', body: { doc: { some: 'data' } } } as any;
        const api = esApi(client, logger);

        const results = await api.update(query);
        return expect(results).toEqual(query.body.doc);
    });

    it('can remove type from update requests on es7', async () => {
        const query = { index: 'someIndex', body: { doc: { some: 'data' } } } as any;

        const es7client = cloneDeep(client);
        es7client.transport._config = { apiVersion: '7.0' };
        const api = esApi(es7client, logger);

        await api.update(query);
        expect(updateQuery).toEqual({ index: 'someIndex', body: { doc: { some: 'data' } } });
    });

    it('can call remove', async () => {
        const query = { index: 'someIndex', id: 'someId' };
        const api = esApi(client, logger);

        const results = await api.remove(query);
        return expect(results).toEqual(true);
    });

    it('can remove type from query on remove call on es7', async () => {
        const query = { index: 'someIndex', id: 'someId' };

        const es7client = cloneDeep(client);
        es7client.transport._config = { apiVersion: '7.0' };
        const api = esApi(es7client, logger);

        await api.remove(query);

        expect(removeQuery).toEqual({ index: 'someIndex', id: 'someId' });
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

    it('can warn window size with version', async () => {
        const api = esApi(client, logger, { index: 'some_index' });
        // FIXME: this test is only really testing a side effect, need a better test
        expect(api.version).toBeDefined();
    });

    it('can call putTemplate', async () => {
        const api = esApi(client, logger);

        const results = await api.putTemplate(template, 'somename');
        return expect(results.acknowledged).toEqual(true);
    });

    it('can call bulkSend', async () => {
        const api = esApi(client, logger);

        const result = await api.bulkSend([
            {
                action: {
                    index: { _index: 'some_index', _id: 1 }
                },
                data: { title: 'foo' }
            },
            {
                action: {
                    delete: { _index: 'some_index', _id: 5 }
                }
            }
        ]);
        expect(bulkData).toEqual({
            body: [
                { index: { _index: 'some_index', _id: 1 } },
                { title: 'foo' },
                { delete: { _index: 'some_index', _id: 5 } }
            ]
        });
        return expect(result).toBe(2);
    });

    it('can remove type from bulkSend', async () => {
        const es7client = cloneDeep(client);

        es7client.transport._config = { apiVersion: '7.0' };

        const api = esApi(es7client, logger);

        await api.bulkSend([{
            action: {
                index: { _index: 'some_index', _id: 1 }
            },
            data: { title: 'foo' }
        },
        {
            action: {
                delete: { _index: 'some_index', _id: 5 }
            }
        }]);
        expect(bulkData).toEqual({
            body: [
                { index: { _index: 'some_index', _id: 1 } },
                { title: 'foo' },
                { delete: { _index: 'some_index', _id: 5 } }
            ]
        });
    });

    it('will not remove _type from record in a bulkSend', async () => {
        const es7client = cloneDeep(client);

        es7client.transport._config = { apiVersion: '7.0' };

        const api = esApi(es7client, logger);

        await api.bulkSend([{
            action: {
                delete: { _index: 'some_index', _id: 5 }
            },
        },
        {
            action: {
                index: { _index: 'some_index', _id: 1 }
            },
            data: { title: 'foo', name: 'joe' }
        }]);
        expect(bulkData).toEqual({
            body: [
                { delete: { _index: 'some_index', _id: 5 } },
                { index: { _index: 'some_index', _id: 1 } },
                { title: 'foo', name: 'joe' }
            ]
        });
    });

    it('will not err if no _type in es7 bulkSend request metadata', async () => {
        const es7client = cloneDeep(client);

        es7client.transport._config = { apiVersion: '7.0' };

        const api = esApi(es7client, logger);

        await api.bulkSend([{
            action: {
                delete: { _index: 'some_index', _id: 5 }
            },
        },
        {
            action: {
                index: { _index: 'some_index', _id: 1 }
            },
            data: { title: 'foo', name: 'joe' }
        }]);

        expect(bulkData).toEqual({
            body: [
                { delete: { _index: 'some_index', _id: 5 } },
                { index: { _index: 'some_index', _id: 1 } },
                { title: 'foo', name: 'joe' }
            ]
        });
    });

    it('can call bulkSend with errors', async () => {
        const api = esApi(client, logger);
        const myBulkData = [{
            action: {
                index: { _index: 'some_index', _id: 1 }
            },
            data: { title: 'foo' }
        },
        {
            action: {
                delete: { _index: 'some_index', _id: 5 }
            }
        }];

        bulkError = [
            'es_rejected_execution_exception',
            'es_rejected_execution_exception',
        ];

        waitFor(20, () => {
            bulkError = false;
        });
        const result = await api.bulkSend(myBulkData);

        expect(result).toBe(2);

        bulkError = [
            'rejected_execution_exception',
            'rejected_execution_exception',
        ];

        waitFor(20, () => {
            bulkError = false;
        });
        const result2 = await api.bulkSend(myBulkData);

        expect(result2).toBe(2);

        bulkError = ['some_thing_else', 'some_thing_else'];

        await expect(
            api.bulkSend(myBulkData)
        ).rejects.toThrow('bulk send error: some_thing_else--someReason');
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

        function makeResponse(opConfig: any, msg: any, data: any | any[], sort?: any) {
            const query: Record<string, any> = {
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

        expect(() => api.buildQuery(badOpConfig1, msg1)).toThrow(
            'if geo_field is specified then the appropriate geo_box or geo_distance query parameters need to be provided as well'
        );
        expect(() => api.buildQuery(badOpConfig2, msg1)).toThrow(
            'Both geo_box_top_left and geo_box_bottom_right must be provided for a geo bounding box query.'
        );
        expect(() => api.buildQuery(badOpConfig3, msg1)).toThrow(
            'Both geo_box_top_left and geo_box_bottom_right must be provided for a geo bounding box query.'
        );
        expect(() => api.buildQuery(badOpConfig4, msg1)).toThrow(
            'Both geo_point and geo_distance must be provided for a geo_point query.'
        );
        expect(() => api.buildQuery(badOpConfig5, msg1)).toThrow(
            'Both geo_point and geo_distance must be provided for a geo_point query.'
        );
        expect(() => api.buildQuery(badOpConfig6, msg1)).toThrow(
            'geo_box and geo_distance queries can not be combined.'
        );
        expect(() => api.buildQuery(badOpConfig7, msg1)).toThrow(
            'bounding box search requires geo_sort_point to be set if any other geo_sort_* parameter is provided'
        );
        expect(() => api.buildQuery(badOpConfig8, msg1)).toThrow(
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

        function makeResponse(opConfig: any, msg: any, data: any | any[]) {
            const query: Record<string, any> = {
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

    it('can set up an index', async () => {
        const api = esApi(client, logger);
        const clusterName = 'teracluster';
        const newIndex = 'teracluster__state';
        const migrantIndexName = 'teracluster__state-v0.0.33';
        const clientName = 'default';

        await expect(api.indexSetup(
            clusterName,
            newIndex,
            migrantIndexName,
            template,
            clientName
        )).resolves.not.toThrow();
    });

    it('can set up an index and wait for availability', async () => {
        const api = esApi(client, logger);
        const clusterName = 'teracluster';
        const newIndex = 'teracluster__state';
        const migrantIndexName = 'teracluster__state-v0.0.33';
        const clientName = 'default';

        searchError = true;

        await expect(Promise.all([
            waitFor(300, () => {
                searchError = false;
            }),
            api.indexSetup(
                clusterName,
                newIndex,
                migrantIndexName,
                template,
                clientName
            )
        ])).resolves.not.toThrow();
    });

    it('can wait for elasticsearch availability', async () => {
        const api = esApi(client, logger);
        const clusterName = 'teracluster';
        const newIndex = 'teracluster__state';
        const migrantIndexName = 'teracluster__state-v0.0.33';
        const clientName = 'default';
        // this mimics an index not available to be searched as its not ready
        elasticDown = true;
        recoverError = true;

        await expect(Promise.all([
            api.indexSetup(
                clusterName,
                newIndex,
                migrantIndexName,
                template,
                clientName,
                1000
            ),
            waitFor(1, () => {
                elasticDown = false;
            }),
            waitFor(1200, () => {
                recoverError = false;
            })
        ])).resolves.not.toThrow();
    });

    it('can send template on state mapping changes, does not migrate', async () => {
        const api = esApi(client, logger);
        const clusterName = 'teracluster';
        const newIndex = 'teracluster__state';
        const migrantIndexName = 'teracluster__state-v0.0.33';
        const clientName = 'default';

        changeMappings = true;

        await api.indexSetup(
            clusterName,
            newIndex,
            migrantIndexName,
            template,
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
        const clientName = 'default';

        changeMappings = true;
        isExecutionTemplate = true;

        const mapping = {
            ...template
        };

        unset(mapping, 'template');

        await api.indexSetup(
            clusterName,
            newIndex,
            migrantIndexName,
            mapping,
            clientName
        );
        expect(reindexCalled).toEqual(true);
        expect(indicesDeleteCalled).toEqual(true);
        expect(indicesPutAliasCalled).toEqual(true);
    });
});
