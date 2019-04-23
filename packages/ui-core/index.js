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
        const staticPath = join(__dirname, 'build');

        if (existsSync(staticPath)) {
            logger.info('Registering ui-core at /data-access');
            app.use('/ui-core', express.static(staticPath));
        }
    },
};
