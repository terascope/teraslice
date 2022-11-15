import 'jest-extended';
import path from 'path';
import { fileURLToPath } from 'url';
import {
    getDefaultConfigFile,
    parseConfigFile
} from '../src/sysconfig.js';

const dirPath = fileURLToPath(new URL('.', import.meta.url));

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
    });
});

function getTestFile(fileName: any) {
    return path.join(dirPath, 'fixtures', fileName);
}
