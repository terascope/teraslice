import 'jest-extended';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createTempDirSync } from 'jest-fixtures';
import Config from '../../src/helpers/config.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));

const tmpDir = createTempDirSync();

describe('config', () => {
    let cliArgs: any;
    let testConfig: any;

    beforeEach(() => {
        cliArgs = {
            'cluster-manager-type': 'native',
            'output-style': 'txt',
            'config-dir': path.join(dirname, '../fixtures/config_dir'),
            'cluster-alias': 'localhost'
        };
        testConfig = new Config(cliArgs);
    });

    afterEach(() => {
        cliArgs = {};
        testConfig = {};
    });

    test('should return a config object', () => {
        expect(testConfig).toBeDefined();
    });

    test('should throw an error if cluster-alias is specified, but not present', () => {
        cliArgs = {
            'config-dir': path.join(dirname, '../fixtures/config_dir'),
            'cluster-alias': 'ts-missing1'
        };
        expect(() => {
            new Config(cliArgs);
        }).toThrow('Alias, ts-missing1, not found in config file');
    });

    test('should make config directory if it does not exist', () => {
        cliArgs = {
            config_dir: path.join(tmpDir, 'config_dir/'),
        };
        testConfig = new Config(cliArgs);
        expect(fs.existsSync(cliArgs.config_dir)).toBeTrue();
    });

    test('should change command line args to camel case', () => {
        expect(testConfig).toBeDefined();
        expect(testConfig.args.configDir).toBeDefined();
        expect(testConfig.args.clusterManagerType).toBeDefined();
    });

    describe('-> aliasFile', () => {
        test('should be defined and value match passed cli value', () => {
            const afile = path.join(cliArgs['config-dir'], 'aliases.yaml');
            expect(testConfig.aliasesFile).toBeDefined();
            expect(testConfig.aliasesFile).toBe(afile);
        });
    });

    describe('-> outdir', () => {
        test('default directory should be defined', () => {
            const odir = process.cwd();
            expect(testConfig.outdir).toBe(odir);
        });

        test('custom directory should be defined', () => {
            cliArgs = {
                'cluster-manager-type': 'native',
                'output-style': 'txt',
                'config-dir': path.join(dirname, '../fixtures/config_dir'),
                'cluster-alias': 'localhost',
                outdir: '/tmp/exportTest/test1'
            };
            testConfig = new Config(cliArgs);

            const edir = path.join('/', 'tmp', 'exportTest', 'test1');
            expect(testConfig.outdir).toBe(edir);
        });
    });

    describe('-> jobStateDir', () => {
        test('should be defined', () => {
            const adir = path.join(cliArgs['config-dir'], 'job_state_files');
            expect(testConfig.jobStateDir).toBe(adir);
        });
    });

    describe('-> assetDir', () => {
        test('should be defined and value match passed cli value', () => {
            const adir = path.join(cliArgs['config-dir'], 'assets');
            expect(testConfig.assetDir).toBeDefined();
            expect(testConfig.assetDir).toBe(adir);
        });
    });

    describe('-> allSubDirs', () => {
        test('should be defined', () => {
            const jdir = path.join(cliArgs['config-dir'], 'job_state_files');
            const adir = path.join(cliArgs['config-dir'], 'assets');
            const odir = process.cwd();
            expect(testConfig.allSubDirs).toBeDefined();
            expect(testConfig.allSubDirs[0]).toBe(jdir);
            expect(testConfig.allSubDirs[1]).toBe(adir);
            expect(testConfig.allSubDirs[2]).toBe(odir);
        });
    });

    describe('-> clusterUrl', () => {
        const newTestConfig = new Config({
            'config-dir': path.join(dirname, '../fixtures/config_dir'),
            cluster_alias: 'localhost'
        });

        test('should be defined', () => {
            expect(newTestConfig.clusterUrl).toBe('http://localhost:5678');
        });
    });
});
