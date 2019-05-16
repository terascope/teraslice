'use strict';

const { join } = require('path');
const { existsSync } = require('fs');

let app;
let express;
let logger;

module.exports = {
    config(config) {
        ({ logger, app, express } = config);
    },

    routes() {
        const uri = '/v2/ui';
        const staticPath = join(__dirname, 'build');
        const indexHtml = join(staticPath, 'index.html');

        if (existsSync(indexHtml)) {
            logger.info(`Registering UI at ${uri}`);
            const router = express.Router();
            router.use(express.static(staticPath));
            router.get('*', (req, res) => {
                res.sendFile(indexHtml);
            });
            app.use(uri, router);
        } else {
            throw new Error(`Failure to add UI at ${uri}, please build ui-core first`);
        }
    },
};
