'use strict';

const path = require('path');
const { createTempDirSync } = require('jest-fixtures');
const Sconfig = require('../../../cmds/lib/sconfig');

const tmpDir = createTempDirSync();

describe('TerasliceCliConfig', () => {
    let cliArgs;
    let testConfig;

    beforeEach(() => {
        cliArgs = {
            cluster_manager_type: 'native',
            output_style: 'txt',
            config_dir: path.join(__dirname, '../../fixtures/config_dir'),
            cluster_alias: 'test1-cluster1'
        };
        testConfig = new Sconfig(cliArgs);
    });

    afterEach(() => {
        cliArgs = {};
        testConfig = {};
    });

    test('should return a config object', () => {
        expect(testConfig.clusterAlias).toBe('test1-cluster1');
        expect(testConfig.clusterUrl).toBe('http://test1-cluster1.net:80');
        // expect(testConfig.args.cluster_url).toBe(undefined);
    });

    test('clusterAlias should be an empty string when an alias is not specified', () => {
        cliArgs = {
            config_dir: path.join(__dirname, '../../fixtures/config_dir'),
        };
        testConfig = new Sconfig(cliArgs);
        expect(testConfig.clusterAlias).toBe('');
    });

    test('clusterAlias should be an empty string when an alias is empty', () => {
        cliArgs = {
            config_dir: path.join(__dirname, '../../fixtures/config_dir'),
            cluster_alias: ''
        };
        testConfig = new Sconfig(cliArgs);
        expect(testConfig.clusterAlias).toBe('');
    });

    test('should throw error when alias not in config file', () => {
        cliArgs = {
            config_dir: path.join(__dirname, '../../fixtures/config_dir'),
            cluster_alias: 'test1-cluster2'
        };
        testConfig = new Sconfig(cliArgs);
        expect(() => {
            testConfig.clusterAlias();
        }).toThrow('alias not defined in config file: test1-cluster2');
    });


    describe('-> clusterUrl', () => {
        test('should be set when cluster_url is specfied', () => {
            cliArgs = {
                config_dir: path.join(__dirname, '../../fixtures/config_dir'),
                cluster_url: ''
            };
            testConfig = new Sconfig(cliArgs);
            expect(testConfig.clusterUrl).toBe('http://test3-cluster3:5678');
        });

        test('should be set when cluster_alias is specfied', () => {
            cliArgs = {
                config_dir: path.join(__dirname, '../../fixtures/config_dir'),
                cluster_alias: 'test1-cluster1'
            };
            testConfig = new Sconfig(cliArgs);
            expect(testConfig.clusterUrl).toBe('http://test1-cluster1.net:80');
        });

        test('cluster_url should override cluster_alias', () => {
            cliArgs = {
                config_dir: path.join(__dirname, '../../fixtures/config_dir'),
                cluster_alias: 'test1-cluster1',
                cluster_url: 'http://test3-cluster3.net:80'
            };
            testConfig = new Sconfig(cliArgs);
            expect(testConfig.clusterUrl).toBe('http://test3-cluster3.net:80');
        });

        test('should throw error if cluster_alias and cluster_url are both unset', () => {
            cliArgs = {
                config_dir: path.join(__dirname, '../../fixtures/config_dir'),
            };
            testConfig = new Sconfig(cliArgs);
            expect(() => {
                testConfig.clusterUrl();
            }).toThrow(/cluster_alias or cluster_url must be set/);
        });
    });

    // test('clusterUrl should throw an exception when the cluster url is an empty string', () => {
    //     cliArgs = {
    //         config_dir: path.join(__dirname, '../../fixtures/config_dir'),
    //         cluster_url: ''
    //     };
    //     testConfig = new Sconfig(cliArgs);
    //     expect(() => {
    //         testConfig.clusterUrl();
    //     }).toThrow('empty cluster_url');
    // });

    test('_urlCheck output correct cluster url', () => {
        testConfig = new Sconfig(cliArgs);
        expect(testConfig._urlCheck('test3-cluster3'))
            .toBe('http://test3-cluster3:5678');
        expect(testConfig._urlCheck('https://test3-cluster3:80'))
            .toBe('https://test3-cluster3:80');
        expect(testConfig._urlCheck('http://test3-cluster3:5678'))
            .toBe('http://test3-cluster3:5678');
        expect(testConfig._urlCheck('http://test3-cluster3'))
            .toBe('http://test3-cluster3');
        expect(() => {
            testConfig._urlCheck('');
        }).toThrow('empty cluster_url');
    });
});
