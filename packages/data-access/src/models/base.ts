import * as es from 'elasticsearch';
import { IndexStore, IndexConfig } from 'elasticsearch-store';
import * as ts from '@terascope/utils';
import * as utils from '../utils';
import { addDefaultMapping, addDefaultSchema } from './config/base';
import { ManagerConfig } from '../interfaces';

/**
 * A base class for handling the different ACL models
*/
export class Base<T extends BaseModel, C extends object = T, U extends object = T> {
    readonly store: IndexStore<T>;
    readonly name: string;
    private _fixDoc: FixDocFn;
    private _uniqueFields: string[];
    private _sanitizeFields: SanitizeFields;

    constructor(client: es.Client, config: ManagerConfig, modelConfig: ModelConfig) {
        const indexConfig: IndexConfig = Object.assign({
            version: 1,
            name: modelConfig.name,
            namespace: config.namespace,
            indexSchema: {
                version: modelConfig.version,
                mapping: addDefaultMapping(modelConfig.mapping),
            },
            dataSchema: {
                schema: addDefaultSchema(modelConfig.schema),
                strict: true,
                allFormatters: true,
            },
            indexSettings: {
                'index.number_of_shards': 5,
                'index.number_of_replicas': 1,
                analysis: {
                    analyzer: {
                        lowercase_keyword_analyzer: {
                            tokenizer: 'keyword',
                            filter: 'lowercase'
                        }
                    }
                }
            },
            ingestTimeField: 'created',
            eventTimeField: 'updated',
            logger: config.logger,
        }, config.storeOptions, modelConfig.storeOptions);

        this.name = utils.toInstanceName(modelConfig.name);
        this.store = new IndexStore(client, indexConfig);

        this._uniqueFields = ts.concat('id', modelConfig.uniqueFields);
        this._sanitizeFields = modelConfig.sanitizeFields || {};

        if (modelConfig.fixDoc) {
            this._fixDoc = modelConfig.fixDoc;
        } else {
            this._fixDoc = (doc) => doc;
        }
    }

    async initialize() {
        return this.store.initialize();
    }

    async shutdown() {
        return this.store.shutdown();
    }

    async create(record: C|ts.DataEntity<C>): Promise<T> {
        const docInput: unknown = {
            ...record,
            id: await utils.makeId(),
            created: utils.makeISODate(),
            updated: utils.makeISODate(),
        };

        const doc = this._sanitizeRecord(docInput as T);

        await this._ensureUnique(doc);
        await this.store.indexWithId(doc, doc.id);
        return doc;
    }

    async deleteById(id: string): Promise<void> {
        await this.store.remove(id);
    }

    async findBy(fields: FieldMap<T>, joinBy = 'AND') {
        const query = Object.entries(fields)
            .map(([field, val]) => {
                if (val == null) {
                    throw new ts.TSError(`Missing value for field "${field}"`, {
                        statusCode: 422
                    });
                }
                return `${field}:"${val}"`;
            })
            .join(` ${joinBy} `);

        const record = ts.getFirst(await this.find(query, 1));
        if (record == null) {
            throw new ts.TSError(`Unable to find ${this.name} by '${query}'`, {
                statusCode: 404,
            });
        }

        return this._fixDoc(record);
    }

    async findById(id: string) {
        return this.store.get(id).then(this._fixDoc);
    }

    async findByAnyId(anyId: string) {
        const fields: FieldMap<T> = {};

        for (const field of this._uniqueFields) {
            fields[field] = anyId;
        }

        return this.findBy(fields, 'OR').then(this._fixDoc);
    }

    async findAll(ids: string[]) {
        return this.store.mget({ ids }).then((result) => {
            return result.map(this._fixDoc);
        });
    }

    async find(q: string, size: number = 10, fields?: (keyof T)[], sort?: string) {
        return this.store.search(q, {
            size,
            sort,
            _source: fields,
        }).then((result) => {
            return result.map(this._fixDoc);
        });
    }

    async update(record: U) {
        const doc = this._sanitizeRecord({
            ...this._fixDoc(record),
            updated: utils.makeISODate(),
        } as T);

        const existing = await this.store.get(doc.id);

        for (const field of this._uniqueFields) {
            if (field === 'id') continue;
            if (doc[field] == null) continue;

            if (existing[field] !== doc[field]) {
                const count = await this._countBy(field, doc[field]);

                if (count > 0) {
                    throw new ts.TSError(`Update requires ${field} to be unique`, {
                        statusCode: 409
                    });
                }
            }
        }

        return this.store.update(doc, doc.id);
    }

    private async _countBy(field: string, val: string): Promise<number> {
        if (!val) return 0;
        return this.store.count(`${field}:"${val}"`);
    }

    private async _ensureUnique(record: T) {
        for (const field of this._uniqueFields) {
            if (field === 'id') continue;
            if (record[field] == null) {
                throw new ts.TSError(`Create requires field ${field}`, {
                    statusCode: 422
                });
            }

            const count = await this._countBy(field, record[field]);
            if (count > 0) {
                throw new ts.TSError(`Create requires ${field} to be unique`, {
                    statusCode: 409
                });
            }
        }

        return;
    }

    private _sanitizeRecord(record: T): T {
        const entries = Object.entries(this._sanitizeFields);

        for (const [field, method] of entries) {
            switch (method) {
                case 'trim':
                    record[field] = utils.trim(record[field]);
                    break;
                case 'trimAndLower':
                    record[field] = utils.trimAndLower(record[field]);
                    break;
                default:
                    continue;
            }
        }

        return record;
    }
}

export interface ModelConfig {
    /** Schema Version */
    version: number;

    /** Name of the Model/Data Type */
    name: string;

    /** ElasticSearch Mapping */
    mapping: any;

    /** JSON Schema */
    schema: any;

    /** Additional IndexStore configuration */
    storeOptions?: Partial<IndexConfig>;

    /** Unqiue fields across on Index */
    uniqueFields?: string[];

    /** Sanitize / cleanup fields mapping, like trim or trimAndToLower */
    sanitizeFields?: SanitizeFields;

    /** A custom function to fix any legacy data on the a record */
    fixDoc?: FixDocFn;
}

export type FixDocFn<T = any> = (doc: T) => T extends ts.DataEntity ? ts.DataEntity<T> : T;

export type FieldMap<T> = {
    [field in keyof T]?: string;
};

export type SanitizeFields = {
    [field: string]: 'trimAndLower'|'trim';
};

export type BaseConfig = ModelConfig & ManagerConfig;

export interface BaseModel {
    /**
     * ID of the view - nanoid 12 digit
    */
    readonly id: string;

    /** Updated date */
    updated: string;

    /** Creation date */
    created: string;
}
