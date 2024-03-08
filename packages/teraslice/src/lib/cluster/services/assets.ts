import express from 'express';
import {
    TSError, parseErrorInfo, logError,
    toBoolean, Logger
} from '@terascope/utils';
import type { Context } from '@terascope/job-components';
import { makeLogger } from '../../workers/helpers/terafoundation.js';
import { AssetsStorage } from '../../storage/index.js';
import {
    makeTable, handleTerasliceRequest, getSearchOptions,
    sendError,
} from '../../utils/api_utils.js';
import { TerasliceRequest, TerasliceResponse } from '../../../interfaces.js';

export class AssetsService {
    context: Context;
    assetsStorage!: AssetsStorage;
    logger: Logger;
    port: string;
    app: express.Express;
    running = false;

    constructor(context: Context) {
        this.context = context;
        this.logger = makeLogger(context, 'assets_service');
        this.app = express();
        const { port } = process.env;
        this.port = port as string;

        this.app.set('json spaces', 4);

        this.app.use((req, _res, next) => {
            // @ts-expect-error
            req.logger = this.logger;
            next();
        });
    }

    async initialize() {
        try {
            this.assetsStorage = await new AssetsStorage(this.context);
            await this.assetsStorage.initialize();

            this.app.get('/status', (req, res) => {
                const requestHandler = handleTerasliceRequest(req as TerasliceRequest, res);
                requestHandler(async () => ({ available: this.running }));
            });

            this.app.post('/assets', (req, res) => {
                const blocking = toBoolean(req.query.blocking);
                this.logger.debug('loading an asset', { blocking });

                const results: Buffer[] = [];

                req.on('data', (buff: Buffer) => {
                    results.push(buff);
                });

                req.on('end', () => {
                    const data = Buffer.concat(results);
                    this.assetsStorage.save(data, blocking)
                        .then(({ assetId, created }) => {
                            const code = created ? 201 : 200;
                            res.status(code).json({
                                _id: assetId
                            });
                        })
                        .catch((err) => {
                            const { statusCode, message } = parseErrorInfo(err);
                            logError(this.logger, err, 'failure saving assets via proxy request');
                            sendError(res, statusCode, message, this.logger);
                        });
                });

                req.on('error', (err) => {
                    const { statusCode, message } = parseErrorInfo(err);
                    logError(this.logger, err, 'failure writing asset');
                    res.status(statusCode).send(message);
                });
            });

            this.app.delete('/assets/:assetId', (req, res) => {
                const { assetId } = req.params;
                // @ts-expect-error
                const requestHandler = handleTerasliceRequest(req as TerasliceRequest, res, `Could not delete asset ${assetId}`);

                if (assetId.length !== 40) {
                    res.status(400).json({
                        error: `asset ${assetId} is not formatted correctly, please provide the full asset_id`
                    });
                } else {
                    requestHandler(async () => {
                        await this.assetsStorage.remove(assetId);
                        return { _id: assetId };
                    });
                }
            });

            this.app.get('/txt/assets', (req, res) => {
                const query = 'id:*';
                this.createAssetTable(query, req as TerasliceRequest, res);
            });

            this.app.get('/txt/assets/:name', (req, res) => {
                const query = `id:* AND name:"${req.params.name}"`;
                this.createAssetTable(query, req as unknown as TerasliceRequest, res);
            });

            this.app.get('/txt/assets/:name/:version', (req, res) => {
                const query = `id:* AND name:"${req.params.name}" AND version:"${req.params.version}"`;
                this.createAssetTable(query, req as unknown as TerasliceRequest, res);
            });

            this.app.get('/assets', (req, res) => {
                const query = 'id:*';
                this.assetsSearch(query, req as TerasliceRequest, res);
            });

            this.app.get('/assets/:name', (req, res) => {
                const query = `id:* AND name:"${req.params.name}"`;
                this.assetsSearch(query, req as unknown as TerasliceRequest, res);
            });

            this.app.get('/assets/:name/:version', (req, res) => {
                const query = `id:* AND name:"${req.params.name}" AND version:"${req.params.version}"`;
                this.assetsSearch(query, req as unknown as TerasliceRequest, res);
            });

            await new Promise((resolve, reject) => {
                // @ts-expect-error
                this.app.listen(this.port, (err: Error) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    this.logger.info(`assets_service is listening on port ${this.port}`);
                    resolve(true);
                });
                // @ts-expect-error TODO: verify this
                this.app.timeout = this.context.sysconfig.teraslice.api_response_timeout;
            });

            await this.assetsStorage.autoload();
            this.running = true;
        } catch (err) {
            this.running = false;
            throw new TSError(err, {
                reason: 'Failure while creating assets_service'
            });
        }
    }

    private createAssetTable(query: string, req: TerasliceRequest, res: TerasliceResponse) {
        const { size, from, sort } = getSearchOptions(req, '_created:desc');

        const defaults = [
            'name',
            'version',
            'id',
            '_created',
            'description',
            'node_version',
            'platform',
            'arch'
        ];

        const s3Defaults = [
            'File',
            'es_record_exists',
            'Size'
        ]

        function mapping(item: Record<string, any>) {
            return (field: string) => {
                if (field === 'description') {
                    return item[field] ? item[field].slice(0, 30) : item[field];
                }
                return item[field];
            };
        }

        function existsInEs(
            s3List: Record<string, any>[], 
            esList: Record<string, any>[]
            ) {
                let result: Record<string, any>[] = [...s3List];
                for (let i = 0; i < result.length; i++) {
                    /// s3AssetId is just the file name without the .zip
                    const s3AssetId = result[i].File.slice(0, -4);
                    console.log('@@@ s3AssetId: ', s3AssetId);
                    result[i].es_record_exists = 'no';
                    for (let j = 0; j < esList.length; j++) {
                        if (s3AssetId === esList[j].id) {
                            result[i].es_record_exists = 'yes';
                            break;
                        }
                    }
                }
                return result as Record<string, any>[];
            }

        const requestHandler = handleTerasliceRequest(req, res, 'Could not get assets');
        requestHandler(async () => {
            const results = await this.assetsStorage.search(
                query, from, size, sort as string, defaults
            ) as any;

            const assets = results.hits.hits.map((asset: any) => {
                const record = asset._source;
                record.id = asset._id;
                return record;
            });

            if (this.context.sysconfig.terafoundation.asset_storage_connection) {
                const s3Assets = await this.assetsStorage.grabS3Info();
                const theTable = makeTable(req, defaults, assets, mapping);
                const updateds3Assets = existsInEs(s3Assets, assets);
                console.log('@@@ updateds3Assets: ', updateds3Assets);
                const s3Table = makeTable(req, s3Defaults, updateds3Assets);
                return `${theTable}\n${s3Table}\n`;
            }

            return makeTable(req, defaults, assets, mapping);
        });
    }

    private assetsSearch(query: string, req: TerasliceRequest, res: TerasliceResponse) {
        const { size, from, sort } = getSearchOptions(req, '_created:desc');

        const requestHandler = handleTerasliceRequest(req, res, 'Could not get assets');

        requestHandler(async () => {
            const fields = ['_created', 'name', 'version', 'description', 'node_version', 'platform', 'arch'];
            const results = await this.assetsStorage.search(
                query, from, size, sort as string, fields
            ) as Record<string, any>;

            return results.hits.hits.map((asset: any) => {
                const record = asset._source;
                record.id = asset._id;
                return record;
            });
        });
    }

    run() {
        return new Promise((resolve) => {
            if (!this.running) {
                resolve(true);
                return;
            }
            const runningInterval = setInterval(() => {
                if (!this.running) {
                    clearInterval(runningInterval);
                    resolve(true);
                }
            }, 1000);
        });
    }

    async shutdown() {
        this.running = false;
        if (!this.assetsStorage) return;
        await this.assetsStorage.shutdown(true);
    }
}
