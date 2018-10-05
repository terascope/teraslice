'use strict';

const fs = require('fs-extra');
const path = require('path');
const { createTempDirSync } = require('jest-fixtures');
const init = require('../../cmds/assets/init');

let counter = 0;
let yarn = true;
let npm = true;
let commandResponse = true;
let installCommand;

const _testFunctions = {
    prompts_inject: {
        asset: true,
        processor: true,
        dependencies: true,
        processor_name: 'test_good',
        asset_desc: 'this is a test',
        asset_version: '0.0.2',
        installer: 'yarn',
    },
    isInstalled: () => {
        let response = yarn;
        counter += 1;
        if (counter !== 1) response = npm;
        return Promise.resolve(response);
    },
    command: (command) => {
        installCommand = command;
        if (commandResponse) {
            return Promise.resolve('done');
        }
        return Promise.reject(new Error('something bad'));
    }
};

const tmpDir = createTempDirSync();

const argv = {
    _: ['asset', 'replace'],
    baseDir: tmpDir,
    init: true,
    cluster: 'cluster.com:5678',
    c: 'cluster.com:5678',
    asset_name: 'test123'
};

describe('init', () => {
    it('should create files and directories', async () => {
        try {
            await init.handler(argv, _testFunctions);
        } catch (e) {
            fail(e);
        }
        const spec = await fs.pathExists(path.join(tmpDir, 'spec'));
        const eslintrc = await fs.pathExists(path.join(tmpDir, '.eslintrc'));
        const rootPackageJson = await fs.pathExists(path.join(tmpDir, 'package.json'));
        const readme = await fs.pathExists(path.join(tmpDir, 'README.md'));
        const assetDir = await fs.pathExists(path.join(tmpDir, 'asset'));
        const assetJson = await fs.pathExists(path.join(tmpDir, 'asset', 'asset.json'));
        const assetPackageJson = await fs.pathExists(path.join(tmpDir, 'asset', 'package.json'));
        const processorDir = await fs.pathExists(path.join(tmpDir, 'asset', _testFunctions.prompts_inject.processor_name));
        const processorIndex = await fs.pathExists(path.join(tmpDir, 'asset', _testFunctions.prompts_inject.processor_name, 'index.js'));

        expect(spec).toBe(true);
        expect(eslintrc).toBe(true);
        expect(rootPackageJson).toBe(true);
        expect(readme).toBe(true);
        expect(assetDir).toBe(true);
        expect(assetJson).toBe(true);
        expect(assetPackageJson).toBe(true);
        expect(processorDir).toBe(true);
        expect(processorIndex).toBe(true);
    });

    it('asset file should be correct', async () => {
        try {
            await init.handler(argv, _testFunctions);
        } catch (e) {
            fail(e);
        }
        const assetFile = await fs.readJson(path.join(tmpDir, 'asset', 'asset.json'));
        expect(assetFile.version).toBe('0.0.2');
        expect(assetFile.name).toBe('test123');
        expect(assetFile.description).toBe('this is a test');
    });

    it('should throw an error if error on creating dir or files', async () => {
        delete argv.baseDir;
        try {
            await init.handler(argv, _testFunctions);
        } catch (e) {
            expect(e).toBe('Path must be a string. Received undefined');
        }
    });
    // should install dependencies
    it('should use yarn if selected', async () => {
        counter = 0;
        argv.baseDir = tmpDir;
        try {
            await init.handler(argv, _testFunctions);
        } catch (e) {
            fail(e);
        }
        expect(installCommand).toBe('cd asset && yarn install');
    });

    it('should use npm if selcted', async () => {
        counter = 0;
        _testFunctions.prompts_inject.installer = 'npm';
        try {
            await init.handler(argv, _testFunctions);
        } catch (e) {
            fail(e);
        }
        expect(installCommand).toBe('cd asset && npm install');
    });

    it('should prefer yarn', async () => {
        counter = 0;
        _testFunctions.prompts_inject.installer = 'cli';
        try {
            await init.handler(argv, _testFunctions);
        } catch (e) {
            fail(e);
        }
        expect(installCommand).toBe('cd asset && yarn install');
    });

    it('should use npm if yarn not found', async () => {
        counter = 0;
        _testFunctions.prompts_inject.installer = 'cli';
        yarn = false;
        try {
            await init.handler(argv, _testFunctions);
        } catch (e) {
            fail(e);
        }
        expect(installCommand).toBe('cd asset && npm install');
    });

    it('should use throw error if neither yarn or npm is installed', async () => {
        counter = 0;
        _testFunctions.prompts_inject.installer = 'cli';
        yarn = false;
        npm = false;
        try {
            await init.handler(argv, _testFunctions);
        } catch (e) {
            expect(e).toBe('The dependencies were not installed, because a package manager was not found.'
            + 'Install yarn and then run yarn install in both root dir and rood dir asset');
        }
        yarn = true;
    });

    it('should use throw error if error on install', async () => {
        counter = 0;
        commandResponse = false;
        try {
            await init.handler(argv, _testFunctions);
        } catch (e) {
            expect(e).toBe('something bad');
        }
    });

    it('should exit if no on dependencies', async () => {
        counter = 0;
        commandResponse = true;
        _testFunctions.prompts_inject.dependencies = false;
        _testFunctions.prompts_inject.installer = 'npm';

        try {
            await init.handler(argv, _testFunctions);
        } catch (e) {
            expect(e).toBe('Exiting the init process');
        }
    });
});
