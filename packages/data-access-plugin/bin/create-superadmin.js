#!/usr/bin/env node

'use strict';

/* eslint-disable no-console */

process.env.USE_DEBUG_LOGGER = 'true';

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

createSuperAdmin(new SimpleContext({
    name: scriptName,
    config_schema: configSchema
}));

async function createSuperAdmin(context) {
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
            logger: context.logger,
        });
    } catch (err) {
        console.error(err);
        process.exit(1);
    }

    try {
        await manager.initialize();
    } catch (err) {
        console.error('Failure initializing data-access manager', err);
        process.exit(1);
    }

    try {
        const user = await manager.createUser({
            user: {
                client_id: 0,
                username: 'admin',
                firstname: 'System',
                lastname: 'Admin',
                email: 'admin@example.com',
                type: 'SUPERADMIN'
            },
            password: 'admin'
        }, false);

        console.log('succesfully created SUPERADMIN', {
            id: user.id,
            client_id: user.client_id,
            username: user.username,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            type: user.type,
            api_token: user.api_token,
        });
        process.exit(0);
    } catch (err) {
        if (err && err.statusCode === 409) {
            console.log('SUPERADMIN already exists');
            process.exit(0);
        }
        console.error('Failure creating SUPERADMIN', err);
        process.exit(1);
    }
}
