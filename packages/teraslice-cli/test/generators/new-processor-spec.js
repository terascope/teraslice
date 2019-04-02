'use strict';

const path = require('path');
const fs = require('fs-extra');
const assert = require('yeoman-assert');
const helpers = require('yeoman-test');

describe('processor generator with no new flag', () => {
    const testAssetBasePath = path.join(__dirname, '..', 'fixtures', 'generators', 'test-processor-example-asset');
    const processPath = path.join(testAssetBasePath, 'example-asset', 'asset');
    const testPath = path.join(testAssetBasePath, 'example-asset', 'spec');

    beforeAll(() => helpers.run(path.join(__dirname, '..', '..', 'generators', 'new-processor'))
        .inDir(testAssetBasePath)
        .withOptions({ new: undefined })
        .withArguments(['example-asset']));

    afterAll(() => {
        fs.removeSync(path.join(__dirname, '..', 'fixtures', 'generators', 'test-processor-example-asset', 'example-asset'));
    });

    it('should generate index.js, processor.js, and schema.js in the asset dir', () => {
        assert.file([
            path.join(processPath, 'example', 'index.js'),
            path.join(processPath, 'example', 'processor.js'),
            path.join(processPath, 'example', 'schema.js')
        ]);
    });

    it('should create a batch processor exporting ExampleProcessor class', () => {
        assert.fileContent([
            [path.join(processPath, 'example', 'processor.js'), 'class Example extends BatchProcessor'],
            [path.join(processPath, 'example', 'processor.js'), 'module.exports = Example;'],
            [path.join(processPath, 'example', 'processor.js'), 'onBatch(batch)']
        ]);
    });

    it('should create an associated test', () => {
        assert.file(path.join(testPath, 'example-spec.js'));
        assert.fileContent([
            [path.join(testPath, 'example-spec.js'), 'const processor = require(\'../asset/example\');'],
            [path.join(testPath, 'example-spec.js'), '_op: \'example\'']
        ]);
    });
});

describe('processor generator with new flag', () => {
    const testAssetBasePath = path.join(__dirname, '..', 'fixtures', 'generators', 'test-processor-new-asset');
    beforeAll(() => helpers.run(path.join(__dirname, '..', '..', 'generators', 'new-processor'))
        .inDir(testAssetBasePath)
        .withOptions({ new: true })
        .withArguments(['test-asset'])
        .withPrompts({
            name: 'good_processor',
            type: 'Map'
        }));

    afterAll(() => {
        fs.removeSync(path.join(__dirname, '..', 'fixtures', 'generators', 'test-processor-asset', 'test-asset2'));
    });

    const processPath = path.join(testAssetBasePath, 'test-asset', 'asset');
    const testPath = path.join(testAssetBasePath, 'test-asset', 'spec');

    it('should generate index.js, processor.js, and schema.js in the asset dir', () => {
        [
            path.join(processPath, 'good_processor', 'index.js'),
            path.join(processPath, 'good_processor', 'processor.js'),
            path.join(processPath, 'good_processor', 'schema.js')
        ].forEach((file) => {
            expect(fs.pathExistsSync(file)).toBe(true);
        });
    });

    it('should generate a Map processor', () => {
        assert.fileContent([
            [path.join(processPath, 'good_processor', 'processor.js'), 'class GoodProcessor extends MapProcessor'],
            [path.join(processPath, 'good_processor', 'processor.js'), 'module.exports = GoodProcessor;'],
            [path.join(processPath, 'good_processor', 'processor.js'), 'map(batch)']
        ]);
    });

    it('should generate an assiated spec file', () => {
        assert.file(path.join(testPath, 'good_processor-spec.js'));
        assert.fileContent(path.join(testPath, 'good_processor-spec.js'), 'const processor = require(\'../asset/good_processor\');');
        assert.fileContent(path.join(testPath, 'good_processor-spec.js'), '_op: \'good_processor\'');
    });
});
