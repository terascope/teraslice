'use strict';

const express = require('express');
const { join } = require('path');
const { existsSync } = require('fs');

let app;
let logger;

module.exports = {
    config(config) {
        ({ logger, app } = config);
    },

    routes() {
        const uri = '/v2/ui';
        const staticPath = join(__dirname, 'build');

        if (existsSync(join(staticPath, 'index.html'))) {
            logger.info(`Registering UI at ${uri}`);
            app.use(uri, express.static(staticPath));
        } else {
            throw new Error(`Failure to add UI at ${uri}, please build ui-core first`);
        }
    },
};
