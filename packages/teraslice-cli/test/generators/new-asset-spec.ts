import path from 'path';
import fs from 'fs-extra';
import assert from 'yeoman-assert';
import helpers from 'yeoman-test';
import { jest } from '@jest/globals';
import { fileURLToPath } from 'url';

const dirPath = fileURLToPath(new URL('.', import.meta.url));

jest.setTimeout(10000);

it.todo('new asset generator should')


// describe('new asset generator should', () => {
//     const testAssetBasePath = path.join(dirPath, '..', 'fixtures', 'generate-new-asset');
//     const rootAssetPath = path.join(testAssetBasePath, 'generated-asset', 'new_asset');
//     const assetAssetPath = path.join(testAssetBasePath, 'generated-asset', 'new_asset', 'asset');

//     const deps = [
//         [helpers.createDummyGenerator(), 'addExampleProcessor: app']
//     ];

//     beforeAll(() => helpers.run(path.join(dirPath, '..', '..', 'src/index.js', 'generators', 'new-asset'))
//         .inDir(testAssetBasePath)
//         .withGenerators(deps)
//         .withArguments(['generated-asset'])
//         .withPrompts({
//             name: 'new_asset',
//             description: 'this is a new asset'
//         }));

//     afterAll(() => {
//         fs.removeSync(rootAssetPath);
//     });

//     it('should create the correct asset dir tree and put files in the correct dir', () => {
//         assert.file([
//             path.join(rootAssetPath, 'package.json'),
//             path.join(rootAssetPath, '.eslintrc'),
//             path.join(rootAssetPath, '.editorconfig'),
//             path.join(rootAssetPath, 'README.md'),
//             path.join(rootAssetPath, 'jest.config.js'),
//             path.join(rootAssetPath, '.gitignore'),
//             path.join(assetAssetPath, 'package.json'),
//             path.join(assetAssetPath, 'asset.json')
//         ]);
//     });

//     it('should modify the file content with the name and description', () => {
//         assert.jsonFileContent(path.join(rootAssetPath, 'package.json'), {
//             name: 'new_asset-bundle',
//             description: 'this is a new asset',
//             version: '0.1.0'
//         });
//         assert.jsonFileContent(path.join(assetAssetPath, 'package.json'), {
//             name: 'new_asset',
//             description: 'this is a new asset',
//             version: '0.1.0'
//         });
//         assert.jsonFileContent(path.join(assetAssetPath, 'asset.json'), {
//             name: 'new_asset',
//             description: 'this is a new asset',
//             version: '0.1.0'
//         });
//     });
// });
