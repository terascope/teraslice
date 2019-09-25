'use strict';

const path = require('path');
const { getDefaultConfigFile, parseConfigFile } = require('../lib/sysconfig');

process.env.TERAFOUNDATION_CONFIG = '';

describe('sysconfig helpers', () => {
    describe('getDefaultConfigFile', () => {
        it('should return undefined if no config is found', () => {
            expect(getDefaultConfigFile()).toBeUndefined();
        });
    });

    describe('parseConfigFile', () => {
        it('should work with a json file', () => {
            const filePath = getTestFile('test-config.json');
            expect(() => parseConfigFile(filePath)).not.toThrow();
        });
        it('should work with a yaml file', () => {
            const filePath = getTestFile('test-config.yaml');
            expect(() => parseConfigFile(filePath)).not.toThrow();
        });

        it('should work with a yaml file', () => {
            const filePath = getTestFile('test-config.yml');
            expect(() => parseConfigFile(filePath)).not.toThrow();
        });
    });
});

function getTestFile(fileName) {
    return path.join(__dirname, 'fixtures', fileName);
}
