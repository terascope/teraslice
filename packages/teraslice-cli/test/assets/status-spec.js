'use strict';

const fs = require('fs-extra');
const path = require('path');
const Promise = require('bluebird');
const { createTempDirSync } = require('jest-fixtures');
const status = require('../../cmds/assets/status');

let clientResponse;
let assetNames = [];

const _cliFunctions = {
    latestAssetVersion: () => {
        return {
            name: 'testing_123',
            version: '0.0.1',
            _create: '01/01/2018',
            id: '123456789',
            description: 'dummy asset.json for testing'
        };
    },
    terasliceClient: {
        cluster: {
            get: (request) => {
                assetNames.push(request);
                return Promise.resolve(clientResponse);
            }
        }
    }
};

const assetJson = {
    name: 'testing_123',
    version: '0.0.1',
    description: 'dummy asset.json for testing',
    tjm: {
        clusters: [
            'http://localhost:5678',
            'http://somecluster:5678'
        ]
    }
};
const tmpDir = createTempDirSync();
const assetPath = path.join(tmpDir, 'asset/asset.json');

const argv = {
    _: ['assets', 'status'],
    baseDir: tmpDir,
    status: true,
    cluster: 'http://localhost:5678'
};

describe('status', () => {
    it('should ensure that can read asset.json', async () => {
        try {
            await status.handler(argv, _cliFunctions);
        } catch (e) {
            expect(e).toBe('Cannot find the asset.json file');
        }
    });
    it('should show status of asset on local host', async () => {
        argv.l = true;
        clientResponse = [
            {
                name: 'testing_123',
                version: '0.0.1',
                _create: '01/01/2018',
                id: '123456789',
                description: 'dummy asset.json for testing'
            }
        ];

        await fs.ensureFile(assetPath);
        await fs.writeJson(assetPath, assetJson, { spaces: 4 });
        try {
            await status.handler(argv, _cliFunctions);
            expect(assetNames.length).toBe(1);
            expect(assetNames[0]).toBe('assets/testing_123');
        } catch (e) {
            fail(e);
        }
        delete argv.l;
    });

    it('should show status on many clusters', async () => {
        assetNames = [];
        argv.c = 'http://localhost:5678';
        clientResponse = [
            {
                name: 'testing_123',
                version: '0.0.1',
                _create: '01/01/2018',
                id: '123456789',
                description: 'dummy asset.json for testing'
            }
        ];

        await fs.ensureFile(assetPath);
        await fs.writeJson(assetPath, assetJson, { spaces: 4 });
        try {
            await status.handler(argv, _cliFunctions);
            expect(assetNames.length).toBe(2);
            expect(assetNames[0]).toBe('assets/testing_123');
            expect(assetNames[1]).toBe('assets/testing_123');
        } catch (e) {
            fail(e);
        }
    });

    it('should show status on many clusters if -a', async () => {
        assetNames = [];
        argv.c = 'http://localhost:5678';
        clientResponse = [
            {
                name: 'testing_123',
                version: '0.0.1',
                _create: '01/01/2018',
                id: '123456789',
                description: 'dummy asset.json for testing',
                a: true
            }
        ];

        await fs.ensureFile(assetPath);
        await fs.writeJson(assetPath, assetJson, { spaces: 4 });
        try {
            await status.handler(argv, _cliFunctions);
            expect(assetNames.length).toBe(2);
            expect(assetNames[0]).toBe('assets/testing_123');
            expect(assetNames[1]).toBe('assets/testing_123');
        } catch (e) {
            fail(e);
        }
    });

    it('should ensure that teraslice-cli data is in the asset.json file', async () => {
        delete assetJson.tjm;
        const tmpDirX = createTempDirSync();
        const argvX = {
            _: ['asset', 'status'],
            baseDir: tmpDirX,
            status: true,
            cluster: 'http://localhost:5678'
        };
        const assetPathX = path.join(tmpDirX, 'asset/asset.json');
        await fs.ensureFile(assetPathX);
        await fs.writeJson(assetPathX, assetJson, { spaces: 4 });
        try {
            await status.handler(argvX, _cliFunctions);
        } catch (e) {
            expect(e).toBe('asset.json file does not have teraslice-cli data, has the asset been deployed?');
        }
    });
});
