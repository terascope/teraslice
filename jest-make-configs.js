import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { castArray, isCI } from '@terascope/core-utils';

const dirname = path.dirname(fileURLToPath(import.meta.url));

const coverageReporters = ['lcov'];

if (!isCI) {
    coverageReporters.push('text-summary');
}

/**
 * THIS WOULD BE PREFERRED,
 * BUT NOT WORKING - NOT TRANSFORMING OR FINDING TESTS
 *
 * https://github.com/jestjs/jest/blob/v29.2.1/packages/jest-types/src/Config.ts#L424-L481
 * https://github.com/jestjs/jest/blob/v29.2.1/packages/jest-types/src/Config.ts#L424-L481
 * https://stackoverflow.com/questions/70999527/where-to-configure-jest-in-a-monorepo
 * https://stackoverflow.com/questions/52308162/jest-projects-different-setupfiles-for-each-project-not-working
 */

export default (_projectDir) => {
    const projectDirs = castArray(_projectDir);

    const runInDir = process.cwd() !== dirname;

    const projects = projectDirs.map((projDir) => {
        const name = path.basename(projDir);
        console.error('==name', process.cwd());
        let pkgRoot;
        let rootDir;
        let parentFolder;

        if (name === 'e2e') {
            parentFolder = name;
            if (runInDir) {
                rootDir = './';
                pkgRoot = '<rootDir>';
            } else {
                rootDir = '../';
                pkgRoot = `<rootDir>/${name}`;
            }
        } else {
            parentFolder = 'packages';
            rootDir = import.meta.dirname;
            pkgRoot = `<rootDir>/packages/${name}`;
        }

        const config = {
            testEnvironment: 'node',
            // testTimeout: 60 * 1000,
            // setupFilesAfterEnv: ['jest-extended/all'],
            rootDir,
            displayName: name,
            roots: [`${pkgRoot}/test`],
            testMatch: [
                `${pkgRoot}/test/**/*-spec.{ts,js}`,
                `${pkgRoot}/test/*-spec.{ts,js}`
            ],
            testPathIgnorePatterns: [
                '<rootDir>/assets',
                `<rootDir>/${parentFolder}/*/node_modules`,
                `<rootDir>/${parentFolder}/*/dist`,
                `<rootDir>/${parentFolder}/teraslice-cli/test/fixtures/`
            ],
            coverageDirectory: `${pkgRoot}/coverage`,

            moduleFileExtensions: ['ts', 'js', 'json', 'node', 'pegjs', 'mjs'],
            extensionsToTreatAsEsm: ['.ts'],
            coveragePathIgnorePatterns: ['/node_modules/', '/test/'],
            watchPathIgnorePatterns: [],
            workerIdleMemoryLimit: '200MB',
            globals: {
                availableExtensions: ['.js', '.ts', '.mjs', 'cjs'],
            },
            transform: {
                ['^.+\\.(t|j)sx?$']: ['@swc/jest',
                    {
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
                    }]
            },

            collectCoverage: true,
            coverageReporters: coverageReporters

        };

        if (fs.existsSync(path.join(projDir, 'test/global.setup.js'))) {
            config.globalSetup = `${pkgRoot}/test/global.setup.js`;
        } else if (fs.existsSync(path.join(projDir, 'test/global.setup.ts'))) {
            config.globalSetup = `${pkgRoot}/dist/test/global.setup.js`;
        }

        if (fs.existsSync(path.join(projDir, 'test/global.teardown.js'))) {
            config.globalTeardown = `${pkgRoot}/test/global.teardown.js`;
        } else if (fs.existsSync(path.join(projDir, 'test/global.teardown.ts'))) {
            config.globalTeardown = `${pkgRoot}/dist/test/global.teardown.js`;
        }

        if (fs.existsSync(path.join(projDir, 'test/test.setup.js'))) {
            config.setupFilesAfterEnv ??= [];
            config.setupFilesAfterEnv.push(`${pkgRoot}/test/test.setup.js`);
        }

        if (fs.existsSync(path.join(projDir, 'lib'))) {
            config.roots ??= [];
            config.roots.push(`${pkgRoot}/lib`);
        } else if (fs.existsSync(path.join(projDir, 'index.js'))) {
            config.roots ??= [];
            config.roots.push(`${pkgRoot}`);
        }

        if (fs.existsSync(path.join(projDir, 'src'))) {
            config.roots ??= [];
            config.roots.push(`${pkgRoot}/src`);
        }

        if (fs.existsSync(path.join(projDir, 'peg'))) {
            config.roots ??= [];
            config.roots.push(`${pkgRoot}/peg`);
        }

        return config;
    });

    return { projects };
};

import fs from 'node:fs';
// import path from 'node:path';
// import { fileURLToPath } from 'node:url';
// import { castArray, isCI } from '@terascope/core-utils';
// import { Config } from 'jest';

// type ProjectConfig = {
//     automock: boolean;
//     cache: boolean;
//     cacheDirectory: string;
//     clearMocks: boolean;
//     coveragePathIgnorePatterns: Array<string>;
//     cwd: string;
//     dependencyExtractor?: string;
//     detectLeaks: boolean;
//     detectOpenHandles: boolean;
//     displayName?: any;// DisplayName;
//     errorOnDeprecated: boolean;
//     extensionsToTreatAsEsm: Array<string>;
//     fakeTimers: any;// FakeTimers;
//     filter?: string;
//     forceCoverageMatch: Array<string>;
//     globalSetup?: string;
//     globalTeardown?: string;
//     globals: any;// ConfigGlobals;
//     haste: any;// HasteConfig;
//     id: string;
//     injectGlobals: boolean;
//     moduleDirectories: Array<string>;
//     moduleFileExtensions: Array<string>;
//     moduleNameMapper: Array<[string, string]>;
//     modulePathIgnorePatterns: Array<string>;
//     modulePaths?: Array<string>;
//     prettierPath: string;
//     resetMocks: boolean;
//     resetModules: boolean;
//     resolver?: string;
//     restoreMocks: boolean;
//     rootDir: string;
//     roots: Array<string>;
//     runner: string;
//     runtime?: string;
//     sandboxInjectedGlobals: Array<keyof typeof globalThis>;
//     setupFiles: Array<string>;
//     setupFilesAfterEnv: Array<string>;
//     skipFilter: boolean;
//     skipNodeResolution?: boolean;
//     slowTestThreshold: number;
//     snapshotResolver?: string;
//     snapshotSerializers: Array<string>;
//     snapshotFormat: any;// SnapshotFormat;
//     testEnvironment: string;
//     testEnvironmentOptions: Record<string, unknown>;
//     testMatch: Array<string>;
//     testLocationInResults: boolean;
//     testPathIgnorePatterns: Array<string>;
//     testRegex: Array<string | RegExp>;
//     testRunner: string;
//     transform: Array<[string, string, Record<string, unknown>]>;
//     transformIgnorePatterns: Array<string>;
//     watchPathIgnorePatterns: Array<string>;
//     unmockedModulePathPatterns?: Array<string>;
//     workerIdleMemoryLimit?: number;
// };

// const dirname = path.dirname(fileURLToPath(import.meta.url));

// export default (_projectDir: string | string[]): Config => {
//     const projectDirs = castArray(_projectDir);

//     const runInDir = process.cwd() !== dirname;

//     const projects: Config['projects'] = projectDirs.map((projDir) => {
//         const name = path.basename(projDir);
//         let pkgRoot;
//         let rootDir;
//         let parentFolder;

//         if (name === 'e2e') {
//             parentFolder = name;
//             if (runInDir) {
//                 rootDir = './';
//                 pkgRoot = '<rootDir>';
//             } else {
//                 rootDir = '../';
//                 pkgRoot = `<rootDir>/${name}`;
//             }
//         } else {
//             parentFolder = 'packages';
//             rootDir = import.meta.dirname;
//         }

//         const config: ProjectConfig = {
//             rootDir,
//             displayName: name,
//             roots: [`${pkgRoot}/test`],
//             testMatch: [
//                 `${pkgRoot}/test/**/*-spec.{ts,js}`,
//                 `${pkgRoot}/test/*-spec.{ts,js}`
//             ],
//             testPathIgnorePatterns: [
//                 '<rootDir>/assets',
//                 `<rootDir>/${parentFolder}/*/node_modules`,
//                 `<rootDir>/${parentFolder}/*/dist`,
//                 `<rootDir>/${parentFolder}/teraslice-cli/test/fixtures/`
//             ],
//             // @ts-expect-error
//             coverageDirectory: `${pkgRoot}/coverage`,

//         };

//         if (fs.existsSync(path.join(projDir, 'test/global.setup.js'))) {
//             config.globalSetup = `${pkgRoot}/test/global.setup.js`;
//         } else if (fs.existsSync(path.join(projDir, 'test/global.setup.ts'))) {
//             config.globalSetup = `${pkgRoot}/dist/test/global.setup.js`;
//         }

//         if (fs.existsSync(path.join(projDir, 'test/global.teardown.js'))) {
//             config.globalTeardown = `${pkgRoot}/test/global.teardown.js`;
//         } else if (fs.existsSync(path.join(projDir, 'test/global.teardown.ts'))) {
//             config.globalTeardown = `${pkgRoot}/dist/test/global.teardown.js`;
//         }

//         if (fs.existsSync(path.join(projDir, 'test/test.setup.js'))) {
//             config.setupFilesAfterEnv ??= [];
//             config.setupFilesAfterEnv.push(`${pkgRoot}/test/test.setup.js`);
//         }

//         if (fs.existsSync(path.join(projDir, 'lib'))) {
//             config.roots ??= [];
//             config.roots.push(`${pkgRoot}/lib`);
//         } else if (fs.existsSync(path.join(projDir, 'index.js'))) {
//             config.roots ??= [];
//             config.roots.push(`${pkgRoot}`);
//         }

//         if (fs.existsSync(path.join(projDir, 'src'))) {
//             config.roots ??= [];
//             config.roots.push(`${pkgRoot}/src`);
//         }

//         if (fs.existsSync(path.join(projDir, 'peg'))) {
//             config.roots ??= [];
//             config.roots.push(`${pkgRoot}/peg`);
//         }

//         return config;
//     });

//     const coverageReporters: Config['coverageReporters'] = ['lcov'];

//     if (!isCI) {
//         coverageReporters.push('text-summary');
//     }

//     const config: Config = {
//         rootDir: import.meta.url,
//         testEnvironment: 'node',
//         testTimeout: 60 * 1000,
//         setupFilesAfterEnv: ['jest-extended/all'],
//         projects,
//         transformIgnorePatterns: [
//             '/node_modules/',
//             '\\.pnp\\.[^\\/]+$'],
//         moduleNameMapper: {
//             '^(\\.{1,2}/.*)\\.js$': '$1',
//         },
//         moduleFileExtensions: ['ts', 'js', 'json', 'node', 'pegjs', 'mjs'],
//         extensionsToTreatAsEsm: ['.ts'],
//         coveragePathIgnorePatterns: ['/node_modules/', '/test/'],
//         watchPathIgnorePatterns: [],
//         workerIdleMemoryLimit: '200MB',
//         globals: {
//             availableExtensions: ['.js', '.ts', '.mjs', 'cjs'],
//         },
//         transform: {
//             ['^.+\\.(t|j)sx?$']: ['@swc/jest',
//                 {
//                     jsc: {
//                         loose: true,
//                         parser: {
//                             syntax: 'typescript',
//                             tsx: false,
//                             decorators: true
//                         },
//                         transform: {
//                             legacyDecorator: true,
//                             decoratorMetadata: true
//                         },
//                         target: 'esnext'
//                     },
//                     module: {
//                         type: 'es6',
//                         strictMode: false,
//                         noInterop: false,
//                         ignoreDynamic: true
//                     }
//                 }]
//         },

//         collectCoverage: true,
//         coverageReporters: coverageReporters
//     };

//     return {
//         projects: [
//             {
//                 displayName: 'scripts',
//                 testEnvironment: 'node',
//                 setupFilesAfterEnv: ['jest-extended/all'],
//                 roots: ['<rootDir>/packages/scripts'],
//                 testMatch: ['**/*.(spec|test).{ts,js}'],
//                 collectCoverage: true,
//                 coverageReporters: ['lcov', 'text-summary']
//             }
//         ]
//     };
// };
