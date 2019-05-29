'use strict';

const { join, resolve, extname } = require('path');
const {
    existsSync, copyFile, mkdir, readFile, writeFile, readdirSync
} = require('fs');
const { promisify } = require('util');
const { homepage: basePath } = require('./package.json');

const pCopyFile = promisify(copyFile);
const pMkdir = promisify(mkdir);
const pReadFile = promisify(readFile);
const pWriteFile = promisify(writeFile);

let app;
let express;
let logger;
let serverConfig;

const buildPath = join(__dirname, 'build');
const staticPath = join(buildPath, 'static');
const assetManifest = join(buildPath, 'asset-manifest.json');
const indexHtml = join(buildPath, 'index.html');
const bkIndexHtml = join(buildPath, 'index.html.bk');
const pluginsDir = join(staticPath, 'plugins');

module.exports = {
    config(config) {
        ({
            logger, app, express, server_config: serverConfig
        } = config);
    },

    config_schema() {
        return {
            plugins: {
                doc: 'List of plugins that will be loaded into the UI',
                default: ['data-access-ui'],
            },
        };
    },

    async pre() {
        if (existsSync(staticPath)) {
            if (!existsSync(pluginsDir)) {
                await pMkdir(pluginsDir);
            }
            const assets = getPluginAssets();
            await updateIndexHtml(assets);
            await updateAssetManifest(assets);
        } else {
            throw new Error('UI Core must be built first');
        }
    },

    routes() {
        const uri = '/v2/ui';

        if (existsSync(indexHtml)) {
            logger.info(`Registering UI at ${uri}`);
            const router = express.Router();
            router.use(
                express.static(buildPath, {
                    index: false,
                })
            );
            router.get('*', index);
            app.use(uri, router);
        } else {
            throw new Error(`Failure to add UI at ${uri}, please build ui-core first`);
        }
    },
};

function index(req, res) {
    res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.header('Pragma', 'no-cache');
    res.header('X-Frame-Options', 'Deny');
    res.sendFile('index.html', { root: buildPath });
}

function getPluginAssets() {
    const plugins = (serverConfig.ui_core && serverConfig.ui_core.plugins) || [];
    plugins.push('ui-data-access');

    const pluginAssets = [];

    if (plugins && plugins.length > 0) {
        for (const name of plugins) {
            const pluginPath = join(getPluginPath(name), 'build');
            if (!existsSync(pluginPath)) {
                throw new Error(`UI Plugin ${name} plugin build directory could not be found`);
            }
            const assets = readdirSync(pluginPath).filter((fileName) => {
                const ext = extname(fileName);
                return ext === '.js';
            });

            pluginAssets.push(
                ...assets.map((fileName) => {
                    const pluginAsset = join(pluginPath, fileName);

                    const publicPath = join(basePath, 'static', 'plugins', name, fileName);
                    const staticAssetPath = join(pluginsDir, name, fileName);
                    return {
                        copyFrom: pluginAsset,
                        copyTo: staticAssetPath,
                        name,
                        fileName,
                        publicPath,
                    };
                })
            );
        }
    }

    return pluginAssets;
}

async function updateAssetManifest(assets) {
    if (!existsSync(assetManifest)) return;
    const contents = JSON.parse(await pReadFile(assetManifest));
    const rootPath = 'static/plugins/';
    const existing = Object.keys(contents.files);

    for (const existingPath of existing) {
        if (existingPath.startsWith(rootPath)) {
            delete contents.files[existingPath];
        }
    }

    for (const asset of assets) {
        const assetPath = join(rootPath, asset.name, asset.fileName);
        contents.files[assetPath] = asset.publicPath;
    }

    await pWriteFile(assetManifest, JSON.stringify(contents, null, 2));
}

async function updateIndexHtml(assets) {
    const prependTag = '</body>';
    let contents = await readIndexHtml();

    for (const asset of assets) {
        const pluginDir = join(pluginsDir, asset.name);
        if (!existsSync(pluginDir)) {
            await pMkdir(pluginDir);
        }
        await pCopyFile(asset.copyFrom, asset.copyTo);
        const scriptTag = `<script src="${asset.publicPath}"></script>`;
        if (!contents.includes(scriptTag)) {
            contents = contents.replace(prependTag, `${scriptTag}${prependTag}`);
        }
    }

    await pWriteFile(indexHtml, contents);
}

async function readIndexHtml() {
    if (!existsSync(indexHtml)) {
        throw new Error('UI Core is missing index.html');
    }

    if (!existsSync(bkIndexHtml)) {
        await pCopyFile(indexHtml, bkIndexHtml);
    }

    return pReadFile(bkIndexHtml, 'utf8');
}

function getPluginPath(name) {
    const configPath = resolve(serverConfig.teraserver.plugins.path);

    if (existsSync(join(configPath, name))) {
        return join(configPath, name);
    }

    try {
        return require.resolve(name);
    } catch (e) {
        try {
            return require.resolve(`@terascope/${name}`);
            // eslint-disable-next-line no-empty
        } catch (err) {}
        throw new Error(`UI Plugin ${name} could not be found, caused by ${e.toString()}`);
    }
}
