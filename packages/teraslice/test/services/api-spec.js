'use strict';

const got = require('got');
const express = require('express');
const { TestContext } = require('@terascope/job-components');
const { version } = require('../../package.json');
const { findPort } = require('../../lib/utils/port_utils');
const makeAPI = require('../../lib/cluster/services/api');

describe('HTTP API', () => {
    const app = express();
    const assetsUrl = 'http://example.asset:1234';
    const context = new TestContext('http-api');
    context.services = {
        execution: {

        },
        jobs: {

        }
    };

    const stateStore = {

    };

    let api;
    let port;
    let baseUrl;
    let server;

    beforeAll(async () => {
        port = await findPort();

        baseUrl = `http://localhost:${port}`;

        api = await makeAPI(context, app, { assetsUrl, stateStore });

        await new Promise((resolve, reject) => {
            server = app.listen(port, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    });

    afterAll(async () => {
        if (api) {
            await api.shutdown();
        }
        if (server) {
            await new Promise((resolve, reject) => {
                server.close((err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        }
    });

    describe('GET /', () => {
        it('should the correct response', async () => {
            let response;

            try {
                response = await got('/', { baseUrl, json: true });
            } catch (err) {
                expect(err.stack).toBeNil();
            }

            expect(response.body).toMatchObject({
                arch: context.arch,
                clustering_type: context.sysconfig.teraslice.cluster_manager_type,
                name: context.sysconfig.teraslice.name,
                node_version: process.version,
                platform: context.platform,
                teraslice_version: `v${version}`
            });
        });
    });
});
