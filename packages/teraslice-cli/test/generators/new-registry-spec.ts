import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'fs-extra';
import assert from 'yeoman-assert';
// @ts-expect-error
import helpers from 'yeoman-test';

const dirname = path.dirname(fileURLToPath(import.meta.url));

describe('processor generator with no new flag', () => {
    const testAssetPath = path.join(dirname, '..', 'fixtures', 'testAsset');
    const helpersPath = path.join(dirname, '..', '..', 'src', 'generators', 'registry');

    beforeAll(() => helpers.run(helpersPath)
        .withArguments([testAssetPath]));

    afterAll(() => {
        fs.removeSync(path.join(dirname, '..', 'fixtures', 'testAsset', 'asset', 'index.js'));
    });

    it('should create an index.js in the testAsset dir', () => {
        assert.file([
            path.join(testAssetPath, 'asset', 'index.js'),
        ]);
    });

    it('should create an index with correct object reference', () => {
        assert.fileContent(path.join(testAssetPath, 'asset', 'index.js'), 'Processor: require(\'./proc/processor.js\')');
        assert.fileContent(path.join(testAssetPath, 'asset', 'index.js'), 'Schema: require(\'./proc/schema.js\')');
        assert.fileContent(path.join(testAssetPath, 'asset', 'index.js'), 'Slicer: require(\'./proc/slicer.js\'),');
        assert.fileContent(path.join(testAssetPath, 'asset', 'index.js'), 'API: require(\'./proc2/api.js\'),');
        assert.fileContent(path.join(testAssetPath, 'asset', 'index.js'), 'Fetcher: require(\'./proc2/fetcher.js\'),');
        assert.fileContent(path.join(testAssetPath, 'asset', 'index.js'), 'Schema: require(\'./proc2/schema.js\'),');
    });
});
