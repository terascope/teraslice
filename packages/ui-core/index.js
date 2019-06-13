'use strict';

const path = require('path');
const fs = require('fs');
const pkgUp = require('pkg-up');
const { promisify } = require('util');
const { homepage: basePath } = require('./package.json');

const pCopyFile = promisify(fs.copyFile);
const pMkdir = promisify(fs.mkdir);
const pReadFile = promisify(fs.readFile);
const pWriteFile = promisify(fs.writeFile);
const pUnlink = promisify(fs.unlink);

let app;
let express;
let logger;
let serverConfig;

const buildPath = path.join(__dirname, 'build');
const staticPath = path.join(buildPath, 'static');
const assetManifest = path.join(buildPath, 'asset-manifest.json');
const indexHtml = path.join(buildPath, 'index.html');
const bkIndexHtml = path.join(buildPath, 'index.html.bk');
const pluginsDir = path.join(staticPath, 'plugins');
const staticBasePath = 'static/plugins';
const watchMode = ['1', 'true'].includes(`${process.env.WATCH_MODE}`.toLowerCase());

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
        if (fs.existsSync(staticPath)) {
            if (!fs.existsSync(pluginsDir)) {
                await pMkdir(pluginsDir);
            }
            await updateAssets();
        } else {
            throw new Error('UI Core must be built first');
        }
    },

    routes() {
        const uri = '/v2/ui';

        if (fs.existsSync(indexHtml)) {
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

let loggedWatch = false;
async function updateAssets() {
    const assets = getPluginAssets();
    await updateIndexHtml(assets);
    await updateAssetManifest(assets);

    if (!watchMode) return;

    // run this in the background
    (async () => {
        try {
            await waitForAssetChanges();
            await updateAssets();
        } catch (err) {
            logger.warn('got error while watching for changes', err);
        }
    })();
}

let lastChanged = [];
const removeOnChange = [];
function waitForAssetChanges() {
    if (!loggedWatch) logger.info('Watching for UI changes');
    loggedWatch = true;

    return new Promise((done) => {
        let running = false;
        const interval = setInterval(async () => {
            if (running) return;

            running = true;
            try {
                if (await checkFilesChanged()) {
                    clearInterval(interval);
                    done();
                    return;
                }
            } catch (err) {
                logger.trace('Error watching for UI changes', err);
            } finally {
                running = false;
            }
        }, 1000);
    });
}

async function checkFilesChanged() {
    const files = getPluginAssets().map(({ copyFrom, name }) => ({ fileName: copyFrom, name }));

    lastChanged.forEach((last) => {
        const found = files.find(({ name }) => last.name === name);
        if (found) return;

        files.push({ name: last.name, fileName: last.fileName });
    });

    const updates = [];
    let changed = false;

    for (const { fileName, name } of files) {
        const modified = await getLastTouched(fileName);
        const last = lastChanged.find(t => t.name === name);
        if (!modified) {
            continue;
        }

        if (!last) {
            updates.push({ name, fileName, modified });
            continue;
        }

        if (last.modified !== modified || last.fileName !== fileName) {
            logger.info(`UI Plugin ${name} has changed`);
            changed = true;
        } else {
            updates.push({ name, fileName, modified });
        }
    }

    if (changed) {
        lastChanged = [];
        for (const file of removeOnChange) {
            if (fs.existsSync(file)) {
                logger.debug(`UI Plugin is removing file ${file}`);
                await pUnlink(file);
            }
        }
    } else {
        lastChanged = updates;
    }
    return changed;
}

function getLastTouched(fileName) {
    try {
        const stats = fs.statSync(fileName);
        // get seconds
        return Math.round(stats.mtime.getTime() / 1000);
    } catch (err) {
        return 0;
    }
}

function getPluginAssets() {
    const plugins = (serverConfig.ui_core && serverConfig.ui_core.plugins) || [];
    plugins.push('ui-data-access');

    const pluginAssets = [];

    if (plugins && plugins.length > 0) {
        for (const name of plugins) {
            const pluginDir = path.join(pluginsDir, name);
            if (!fs.existsSync(pluginDir)) {
                fs.mkdirSync(pluginDir);
            }
            const pluginPath = path.join(getPluginPath(name), 'build');
            if (!fs.existsSync(pluginPath)) {
                throw new Error(`UI Plugin ${name} plugin build directory could not be found`);
            }
            const assets = fs.readdirSync(pluginPath).filter((fileName) => {
                const ext = path.extname(fileName);
                return ext === '.js';
            });

            pluginAssets.push(
                ...assets.map((fileName) => {
                    const copyFrom = path.join(pluginPath, fileName);

                    const ext = path.extname(fileName);
                    const fileBase = path.basename(fileName, ext);
                    const modified = getLastTouched(copyFrom);
                    const targetFileName = `${fileBase}.${modified}${ext}`;

                    const publicPath = path.join(basePath, staticBasePath, name, targetFileName);

                    const copyTo = path.join(pluginsDir, name, targetFileName);
                    const assetPath = path.join(staticBasePath, name, targetFileName);

                    return {
                        copyFrom,
                        copyTo,
                        name,
                        fileName,
                        publicPath,
                        targetFileName,
                        assetPath,
                    };
                })
            );
        }
    }

    return pluginAssets;
}

async function updateAssetManifest(assets) {
    if (!fs.existsSync(assetManifest)) return;
    const contents = JSON.parse(await pReadFile(assetManifest));

    for (const assetPath of Object.keys(contents.files)) {
        if (assetPath.startsWith(staticBasePath)) {
            const filePath = path.join(buildPath, assetPath);
            const found = assets.find(asset => asset.assetPath === assetPath);
            if (!found && fs.existsSync(filePath)) {
                if (!removeOnChange.includes(filePath)) {
                    removeOnChange.push(filePath);
                }
            }
            delete contents.files[assetPath];
        }
    }

    for (const asset of assets) {
        contents.files[asset.assetPath] = asset.publicPath;
    }

    await pWriteFile(assetManifest, JSON.stringify(contents, null, 2));
}

async function updateIndexHtml(assets) {
    const prependTag = '</body>';
    let contents = await readIndexHtml();

    for (const asset of assets) {
        await pCopyFile(asset.copyFrom, asset.copyTo);
        const scriptTag = `<script src="${asset.publicPath}"></script>`;
        if (!contents.includes(scriptTag)) {
            contents = contents.replace(prependTag, `${scriptTag}${prependTag}`);
        }
    }

    await pWriteFile(indexHtml, contents);
}

async function readIndexHtml() {
    if (!fs.existsSync(indexHtml)) {
        throw new Error('UI Core is missing index.html');
    }

    if (!fs.existsSync(bkIndexHtml)) {
        await pCopyFile(indexHtml, bkIndexHtml);
    }

    return pReadFile(bkIndexHtml, 'utf8');
}

function getPluginPath(name) {
    let resolvedPath;

    const configPath = path.resolve(serverConfig.teraserver.plugins.path);

    if (!resolvedPath && fs.existsSync(path.join(configPath, name))) {
        resolvedPath = path.join(configPath, name);
    }

    if (!resolvedPath) {
        try {
            resolvedPath = require.resolve(name);
            // eslint-disable-next-line no-empty
        } catch (e) {}
    }

    if (!resolvedPath) {
        try {
            resolvedPath = require.resolve(`@terascope/${name}`);
            // eslint-disable-next-line no-empty
        } catch (err) {}
    }

    if (resolvedPath) {
        resolvedPath = path.dirname(
            pkgUp.sync({
                cwd: resolvedPath,
            })
        );
    }

    if (!resolvedPath) {
        throw new Error(`UI Plugin ${name} could not be found`);
    }

    return resolvedPath;
}
