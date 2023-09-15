// import 'jest-extended';
// import fs from 'fs';
// import os from 'os';
// import path from 'path';
// import { cloneDeep } from '@terascope/utils';
// import { BumpPackageOptions, BumpType, BumpPkgInfo, BumpAssetOnlyOptions } from '../src/helpers/bump/interfaces';
// import { PackageInfo } from '../src/helpers/interfaces';
// import { bumpAssetVersion, bumpAssetOnly } from '../src/helpers/bump/index';
// import {
//     getPackagesToBump,
//     bumpPackagesList,
//     getBumpCommitMessages
// } from '../src/helpers/bump/utils';

// describe('Bump-asset', () => {
//     const tempRootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'asset'));
//     const testPackages: PackageInfo[] = [
//         {
//             name: 'package-asset',
//             version: '1.0.0',
//             relativeDir: 'asset',
//             dependencies: {
//             },
//             devDependencies: {
//             },
//         } as any,
//         {
//             name: 'package-2',
//             version: '1.0.0',
//             dependencies: {
//                 'package-1': '^2.1.0'
//             },
//             devDependencies: {
//             },
//         } as any,
//         {
//             name: 'package-1',
//             version: '2.1.0',
//             dependencies: {
//             },
//             devDependencies: {
//             },
//         } as any,
//         {
//             name: 'package-main-asset',
//             version: '1.0.0',
//             relativeDir: '.',
//             dir: `${tempRootDir}`,
//             dependencies: {
//             },
//             terascope: {
//                 main: true,
//                 root: true
//             }
//         } as any,
//     ];

//     const assetJSONData = `{
//         "name": "asset-json",
//         "version": "1.0.0",
//         "description": "A set of processors for working with files"
//     }`;
//     afterAll(async () => {
//         /// Remove the temp root file after all tests have been done
//         fs.rmSync(tempRootDir, { recursive: true, force: true });
//     });
//     describe('when bumping an Asset', () => {
//         describe('when release=patch', () => {
//             const packages = cloneDeep(testPackages);
//             const options: BumpAssetOnlyOptions = {
//                 release: 'patch',
//             };
//             let result: Record<string, BumpPkgInfo>;

//             beforeAll(async () => {
//                 // result = await getPackagesToBump(testPackages, options);
//                 /// Create an asset folder with asset.json
//                 const assetPath = `${tempRootDir}/asset`;
//                 fs.mkdirSync(assetPath);
//                 fs.writeFileSync(`${assetPath}/asset.json`, assetJSONData);
//             });

//             afterAll(async () => {
//                 /// Remove the asset folder within the temp root file
//                 fs.rmSync(`${tempRootDir}/asset`, { recursive: true, force: true });
//             });

//             // it('should return a list of correctly bump packages', () => {
//             //     expect(result).toEqual({
//             //         'package-1': {
//             //             from: '2.1.0',
//             //             to: '2.1.1',
//             //             main: false,
//             //             deps: [
//             //                 {
//             //                     type: BumpType.Prod,
//             //                     name: 'package-2'
//             //                 },
//             //             ]
//             //         },
//             //         'package-2': {
//             //             from: '1.0.0',
//             //             to: '1.0.1',
//             //             main: false,
//             //             deps: []
//             //         }
//             //     });
//             // });

//             // it('should correctly bump the packages list', () => {
//             //     bumpPackagesList(result, packages);
//             //     expect(packages).toEqual([
//             //         {
//             //             name: 'package-asset',
//             //             version: '1.0.0',
//             //             relativeDir: 'asset',
//             //             dependencies: {
//             //             },
//             //             devDependencies: {
//             //             }
//             //         },
//             //         {
//             //             name: 'package-2',
//             //             version: '1.0.1',
//             //             dependencies: {
//             //                 'package-1': '^2.1.1'
//             //             },
//             //             devDependencies: {
//             //             },
//             //         },
//             //         {
//             //             name: 'package-1',
//             //             version: '2.1.1',
//             //             dependencies: {
//             //             },
//             //             devDependencies: {
//             //             },
//             //         },
//             //         {
//             //             name: 'package-main-asset',
//             //             version: '1.0.0',
//             //             relativeDir: '.',
//             //             dir: `${tempRootDir}`,
//             //             dependencies: {
//             //             },
//             //             terascope: {
//             //                 main: true,
//             //                 root: true
//             //             }
//             //         },
//             //     ]);
//             // });

//             it('should correctly bump all 3 asset versions', async () => {
//                 await bumpAssetVersion(packages, options, true);
//                 const pathToAssetJson = `${tempRootDir}/asset/asset.json`;
//                 const assetJsonInfo = JSON.parse(fs.readFileSync(pathToAssetJson, 'utf8'));
//                 expect(packages).toEqual([
//                     {
//                         name: 'package-asset',
//                         version: '1.0.1',
//                         relativeDir: 'asset',
//                         dependencies: {
//                         },
//                         devDependencies: {
//                         }
//                     },
//                     {
//                         name: 'package-2',
//                         version: '1.0.0',
//                         dependencies: {
//                             'package-1': '^2.1.0'
//                         },
//                         devDependencies: {
//                         },
//                     },
//                     {
//                         name: 'package-1',
//                         version: '2.1.0',
//                         dependencies: {
//                         },
//                         devDependencies: {
//                         },
//                     },
//                     {
//                         name: 'package-main-asset',
//                         version: '1.0.1',
//                         relativeDir: '.',
//                         dir: `${tempRootDir}`,
//                         dependencies: {
//                         },
//                         terascope: {
//                             main: true,
//                             root: true
//                         }
//                     }
//                 ]);
//                 expect(assetJsonInfo.version).toEqual('1.0.1');
//             });

//             it('should be able to get a readable commit message', () => {
//                 const messages = getBumpCommitMessages(result, options.release);
//                 expect(messages).toEqual([
//                     'bump: (patch) package-asset@1.0.1, package-main-asset@1.0.1'
//                 ]);
//             });
//         });
//     });
// });

export {}