#!/usr/bin/env node

'use strict';

/* eslint-disable no-console */

process.env.USE_DEBUG_LOGGER = 'true';
process.env.DEBUG = '*teraslice*';

const fs = require('fs');
const path = require('path');
const { get } = require('@terascope/utils');
const { SimpleContext } = require('terafoundation');
const { ACLManager } = require('@terascope/data-access');

const scriptName = path.basename(process.argv[1]);

const systemSchemaPath = path.join(process.cwd(), 'system_schema.js');
if (!fs.existsSync(systemSchemaPath)) {
    console.error(`${scriptName} must be ran in the root of teraserver`);
    process.exit(1);
}

const { configSchema } = require(systemSchemaPath);

simpleMigrate(
    new SimpleContext({
        name: scriptName,
        config_schema: configSchema
    })
);

async function simpleMigrate(context) {
    const connection = get(context, 'sysconfig.data_access.connection', 'default');
    const namespace = get(context, 'sysconfig.data_access.namespace');

    const { client } = context.foundation.getConnection({
        type: 'elasticsearch',
        endpoint: connection,
        cached: true
    });

    let manager;
    try {
        manager = new ACLManager(client, {
            namespace,
            logger: context.logger
        });
    } catch (err) {
        console.error(err);
        process.exit(1);
    }

    try {
        const results = await manager.simpleMigrate();

        console.log('succesfully migrated index', results);
        process.exit(0);
    } catch (err) {
        console.error('Failure migrate index', err);
        process.exit(1);
    }
}
