'use strict';

const { join, resolve } = require('path');
const {
    existsSync, copyFile, mkdir, readFile, writeFile
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
const indexHtml = join(buildPath, 'index.html');
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
            let htmlContents = await pReadFile(indexHtml, 'utf8');
            if (!existsSync(pluginsDir)) {
                await pMkdir(pluginsDir);
            }
            for (const asset of getPluginAssets()) {
                const pluginDir = join(pluginsDir, asset.name);
                if (!existsSync(pluginDir)) {
                    await pMkdir(pluginDir);
                }
                await pCopyFile(asset.copyFrom, asset.copyTo);
                const scriptTag = `<script src="${asset.publicPath}"></script>`;
                if (!htmlContents.includes(scriptTag)) {
                    htmlContents = htmlContents.replace('</body>', `${scriptTag}</body>`);
                }
            }
            await pWriteFile(indexHtml, htmlContents);
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
            const pluginPath = getPluginPath(name);
            const pluginJs = join(pluginPath, 'build', 'plugin.js');
            if (!existsSync(pluginJs)) {
                throw new Error(`UI Plugin ${name} plugin bundle could not be found`);
            }
            const publicPath = join(basePath, 'static', 'plugins', name, 'plugin.js');
            const staticAssetPath = join(pluginsDir, name, 'plugin.js');
            pluginAssets.push({
                copyFrom: pluginJs,
                copyTo: staticAssetPath,
                name,
                publicPath,
            });
        }
    }

    return pluginAssets;
}

function getPluginPath(name) {
    const configPath = resolve(serverConfig.teraserver.plugins.path);

    if (existsSync(join(configPath, name))) {
        return join(configPath, name);
    }

    try {
        return require.resolve(name);
    } catch (e) {
        throw new Error(`UI Plugin ${name} could not be found, caused by ${e.toString()}`);
    }
}
