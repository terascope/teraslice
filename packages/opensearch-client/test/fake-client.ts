import { isEmpty } from '@terascope/core-utils';

export const template1 = {
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

export class FakeClient {
    transport = {
        closed: false,
        requestTimeout: 50,
        connectionPool: {
            _conns: {
                alive: [{}],
                dead: [{}],
            },
        }
    };

    recordsReturned: Record<string, any>[] = [];
    mgetQuery: any;
    bulkData: any;
    searchQuery: any;
    indexQuery: any;
    createQuery: any;
    updateQuery: any;
    removeQuery: any;
    failed = 0;
    failures: any[] = [];
    total = 0;
    bulkError: any | any[] = false;
    searchError: any = false;
    elasticDown = false;
    recoverError = false;
    changeMappings = false;
    putTemplateCalled = false;
    reindexCalled = false;
    isExecutionTemplate = false;
    indexAlreadyExists = true;
    indicesDeleteCalled = false;
    indicesPutAliasCalled = false;
    version = '';

    constructor() {}

    async mget(query: Record<string, any>) {
        this.mgetQuery = query;
        return {
            docs: this.recordsReturned
        };
    }

    async get() {
        return this.recordsReturned[0];
    }

    async index(query: Record<string, any>) {
        this.indexQuery = query;
        return this._postedData('created');
    }

    async create(obj: Record<string, any>) {
        this.createQuery = obj;
        return this._postedData('created', obj.id);
    }

    async update(query: Record<string, any>) {
        this.updateQuery = query;
        return this._postedData('updated');
    }

    async delete(query: Record<string, any>) {
        this.removeQuery = query;
        return this._postedData('deleted');
    }

    async bulk(data: Record<string, any>[]) {
        this.bulkData = data;
        return this._createBulkResponse(data);
    }

    async search(_query: Record<string, any>) {
        this.searchQuery = _query;
        if (this.searchError) return Promise.reject(this.searchError);
        return {
            _shards: {
                failed: this.failed,
                failures: this.failures
            },
            hits: {
                total: this.total,
                hits: this.recordsReturned
            }
        };
    }

    async reindex() {
        this.reindexCalled = true;
        return true;
    }

    get indices() {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const parent = this;
        return {
            async exists(): Promise<boolean> {
                if (parent.elasticDown) return Promise.reject(new Error('Elasticsearch is down'));
                return parent.indexAlreadyExists;
            },

            async create() {
                return { acknowledged: true, shards_acknowledged: true };
            },

            async refresh() {
                return { _shards: { total: 10, successful: 5, failed: 0 } };
            },

            async recovery(query: Record<string, any>) {
                return parent._getRecoveryData(query.index);
            },

            async getSettings() {
                const obj: Record<string, any> = {};
                obj.some_index = { settings: { index: { max_result_window: 1000000 } } };
                return obj;
            },

            async putTemplate() {
                parent.putTemplateCalled = true;
                return { acknowledged: true };
            },
            async delete() {
                parent.indicesDeleteCalled = true;
                return true;
            },
            async putAlias() {
                parent.indicesPutAliasCalled = true;
                return true;
            },
            async getMapping() {
                let index = 'teracluster__state';
                let templateArg: Record<string, any> = template1;

                if (parent.isExecutionTemplate) {
                    index = 'teracluster__ex';
                    templateArg = template2;
                    parent.indexAlreadyExists = false;
                }

                return parent._simulateTemplateResponse(templateArg, index);
            }
        };
    }

    get cluster() {
        const { version } = this;
        return {
            async stats() {
                return { nodes: { versions: version } };
            }
        };
    }

    _createBulkResponse(results: Record<string, any>[]) {
        const response: Record<string, any> = { took: 22, errors: false, items: results };
        if (!isEmpty(this.bulkError)) {
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
                        error: { type: this.bulkError[i] || 'someType', reason: 'someReason' },
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

    _getRecoveryData(index: string) {
        const obj: Record<string, any> = {};
        obj[index] = {
            shards: [{ shard: 1, primary: true, stage: this.recoverError ? 'notdone' : 'DONE' }]
        };
        return obj;
    }

    _simulateTemplateResponse(
        originalMapping: Record<string, any>,
        index: string,
    ) {
        const results: Record<string, any> = {};
        results[index] = { mappings: JSON.parse(JSON.stringify(originalMapping.mappings)) };
        // simulate the 'false' to false issue
        results[index].mappings.dynamic = 'false';
        if (this.changeMappings) {
            results[index].mappings.properties.newKey = { type: 'keyword' };
        }

        return results;
    }

    _postedData(action: string, id?: string) {
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
}
