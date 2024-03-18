import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dirPath = fileURLToPath(new URL('.', import.meta.url));
const configModulePath = path.join(dirPath, '../../jest.config.base.js');

const module = await import(configModulePath);

const config = module.default(dirPath);

config.extensionsToTreatAsEsm = ['.ts'];
config.moduleNameMapper = {
    '^(\\.{1,2}/.*)\\.js$': '$1',
};
config.testTimeout = 60 * 1000;
config.transform = {};

config.transform['^.+\\.(t|j)sx?$'] = ['@swc/jest', {
    jsc: {
        loose: true,
        parser: {
            syntax: 'typescript',
            tsx: false,
            decorators: true
        },
        transform: {
            legacyDecorator: true,
            decoratorMetadata: true
        },
        target: 'esnext'
    },
    module: {
        type: 'es6',
        strictMode: false,
        noInterop: false,
        ignoreDynamic: true
    }
}];

config.transformIgnorePatterns = [];
config.preset = '';

export default config;
