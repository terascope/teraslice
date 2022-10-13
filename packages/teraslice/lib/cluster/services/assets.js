import express from 'express';
import {
    TSError, parseErrorInfo, logError,
    toBoolean
} from '@terascope/utils';
import { makeLogger } from '../../workers/helpers/terafoundation';
import makeAssetsStore from '../../storage/assets';
import {
    makeTable, handleRequest, getSearchOptions,
    sendError,
} from '../../utils/api_utils';

export default function assetsService(context) {
    const logger = makeLogger(context, 'assets_service');
    const app = express();

    let assetsStore;
    let running = false;

    app.set('json spaces', 4);

    app.use((req, res, next) => {
        req.logger = logger;
        next();
    });

    app.get('/status', (req, res) => {
        const requestHandler = handleRequest(req, res);
        requestHandler(() => ({ available: running }));
    });

    app.post('/assets', (req, res) => {
        const blocking = toBoolean(req.query.blocking);
        logger.debug('loading an asset', { blocking });

        const results = [];

        req.on('data', (buff) => {
            results.push(buff);
        });

        req.on('end', () => {
            const data = Buffer.concat(results);
            assetsStore.save(data, blocking)
                .then(({ assetId, created }) => {
                    const code = created ? 201 : 200;
                    res.status(code).json({
                        _id: assetId
                    });
                })
                .catch((err) => {
                    const { statusCode, message } = parseErrorInfo(err);
                    logError(logger, err, 'failure saving assets via proxy request');
                    sendError(res, statusCode, message);
                });
        });

        req.on('error', (err) => {
            const { statusCode, message } = parseErrorInfo(err);
            logError(logger, err, 'failure writing asset');
            res.status(statusCode).send(message);
        });
    });

    app.delete('/assets/:assetId', (req, res) => {
        const { assetId } = req.params;
        const requestHandler = handleRequest(req, res, `Could not delete asset ${assetId}`);

        if (assetId.length !== 40) {
            res.status(400).json({
                error: `asset ${assetId} is not formatted correctly, please provide the full asset_id`
            });
        } else {
            requestHandler(async () => {
                await assetsStore.remove(assetId);
                return { _id: assetId };
            });
        }
    });

    app.get('/txt/assets', (req, res) => {
        const query = 'id:*';
        createAssetTable(query, req, res);
    });

    app.get('/txt/assets/:name', (req, res) => {
        const query = `id:* AND name:"${req.params.name}"`;
        createAssetTable(query, req, res);
    });

    app.get('/txt/assets/:name/:version', (req, res) => {
        const query = `id:* AND name:"${req.params.name}" AND version:"${req.params.version}"`;
        createAssetTable(query, req, res);
    });

    app.get('/assets', (req, res) => {
        const query = 'id:*';
        assetsSearch(query, req, res);
    });

    app.get('/assets/:name', (req, res) => {
        const query = `id:* AND name:"${req.params.name}"`;
        assetsSearch(query, req, res);
    });

    app.get('/assets/:name/:version', (req, res) => {
        const query = `id:* AND name:"${req.params.name}" AND version:"${req.params.version}"`;
        assetsSearch(query, req, res);
    });

    function createAssetTable(query, req, res) {
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

        function mapping(item) {
            return (field) => {
                if (field === 'description') {
                    return item[field] ? item[field].slice(0, 30) : item[field];
                }
                return item[field];
            };
        }

        const requestHandler = handleRequest(req, res, 'Could not get assets');
        requestHandler(async () => {
            const results = await assetsStore.search(query, from, size, sort, defaults);
            const assets = results.hits.hits.map((asset) => {
                const record = asset._source;
                record.id = asset._id;
                return record;
            });
            return makeTable(req, defaults, assets, mapping);
        });
    }

    function assetsSearch(query, req, res) {
        const { size, from, sort } = getSearchOptions(req, '_created:desc');

        const requestHandler = handleRequest(req, res, 'Could not get assets');
        requestHandler(async () => {
            const fields = ['_created', 'name', 'version', 'description', 'node_version', 'platform', 'arch'];
            const results = await assetsStore.search(query, from, size, sort, fields);
            return results.hits.hits.map((asset) => {
                const record = asset._source;
                record.id = asset._id;
                return record;
            });
        });
    }

    const { port } = process.env;
    return {
        async initialize() {
            try {
                assetsStore = await makeAssetsStore(context);

                await new Promise((resolve, reject) => {
                    app.listen(port, (err) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        logger.info(`assets_service is listening on port ${port}`);
                        resolve();
                    });
                    app.timeout = context.sysconfig.teraslice.api_response_timeout;
                });

                await assetsStore.autoload();
                running = true;
            } catch (err) {
                running = false;
                throw new TSError(err, {
                    reason: 'Failure while creating assets_service'
                });
            }
        },
        run() {
            return new Promise((resolve) => {
                if (!running) {
                    resolve();
                    return;
                }
                const runningInterval = setInterval(() => {
                    if (!running) {
                        clearInterval(runningInterval);
                        resolve();
                    }
                }, 1000);
            });
        },
        async shutdown() {
            running = false;
            if (!assetsStore) return;
            await assetsStore.shutdown(true);
        }
    };
};
