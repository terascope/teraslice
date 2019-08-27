'use strict';

import path from 'path';
import fs from 'fs-extra';
import assert from 'yeoman-assert';
// @ts-ignore
import helpers from 'yeoman-test';

describe('processor generator with no new flag', () => {
    const exampleAssetBasePath = path.join(__dirname, '..', 'fixtures', 'generate-new-processor');
    const processPath = path.join(exampleAssetBasePath, 'example-asset', 'asset');
    const testPath = path.join(exampleAssetBasePath, 'example-asset', 'test');
    const helpersPath = path.join(__dirname, '..', '..', 'src', 'generators', 'new-processor');

    beforeAll(() => helpers.run(helpersPath)
        .inDir(exampleAssetBasePath)
        .withOptions({ new: undefined })
        .withArguments(['example-asset']));

    afterAll(() => {
        fs.removeSync(path.join(__dirname, '..', 'fixtures', 'generate-new-processor', 'example-asset', 'asset', 'example'));
        fs.removeSync(path.join(__dirname, '..', 'fixtures', 'generate-new-processor', 'example-asset', 'spec', 'example-spec.js'));
    });

    it('should generate index.js, processor.js, and schema.js in the asset dir', () => {
        assert.file([
            path.join(processPath, 'example', 'processor.js'),
            path.join(processPath, 'example', 'schema.js')
        ]);
    });

    it('should create a batch processor exporting ExampleProcessor class', () => {
        assert.fileContent([
            [path.join(processPath, 'example', 'processor.js'), new RegExp('class Example extends BatchProcessor')],
            [path.join(processPath, 'example', 'processor.js'), new RegExp('module.exports = Example;')],
            [path.join(processPath, 'example', 'processor.js'), new RegExp('onBatch(dataArray)')],
            [path.join(processPath, 'example', 'processor.js'), new RegExp('dataArray.forEach((doc) => {')]
        ]);
    });

    it('should create an associated test', () => {
        assert.file(path.join(testPath, 'example-spec.js'));
        assert.fileContent([
            [path.join(testPath, 'example-spec.js'), new RegExp('const Processor = require(\'../asset/example/processor.js\')')],
            [path.join(testPath, 'example-spec.js'), new RegExp('_op: \'example\'')],
            [path.join(testPath, 'example-spec.js'), new RegExp('add type to all the docs')]
        ]);
    });
});

describe('processor generator with new flag', () => {
    const testAssetBasePath = path.join(__dirname, '..', 'fixtures', 'generate-new-processor');
    const processPath = path.join(testAssetBasePath, 'test-asset', 'asset');
    const testPath = path.join(testAssetBasePath, 'test-asset', 'test');
    const helpersPath = path.join(__dirname, '..', '..', 'src', 'generators', 'new-processor');

    beforeAll(() => helpers.run(helpersPath)
        .inDir(testAssetBasePath)
        .withOptions({ new: true })
        .withArguments(['test-asset'])
        .withPrompts({
            name: 'good_processor',
            type: 'map'
        }));

    afterAll(() => {
        fs.removeSync(path.join(__dirname, '..', 'fixtures', 'generate-new-processor', 'test-asset', 'asset', 'good_processor'));
        fs.removeSync(path.join(__dirname, '..', 'fixtures', 'generate-new-processor', 'test-asset', 'test', 'good_processor-spec.js'));
    });

    it('should generate index.js, processor.js, and schema.js in the asset dir', () => {
        assert.file([
            path.join(processPath, 'good_processor', 'processor.js'),
            path.join(processPath, 'good_processor', 'schema.js')
        ]);
    });

    it('should generate a Map processor', () => {
        assert.fileContent([
            [path.join(processPath, 'good_processor', 'processor.js'), new RegExp('class GoodProcessor extends MapProcessor')],
            [path.join(processPath, 'good_processor', 'processor.js'), new RegExp('module.exports = GoodProcessor;')],
            [path.join(processPath, 'good_processor', 'processor.js'), new RegExp('map(doc)')]
        ]);
    });

    it('should generate an assiated spec file', () => {
        assert.file(path.join(testPath, 'good_processor-spec.js'));
        // tslint:disable-next-line:max-line-length
        assert.fileContent(path.join(testPath, 'good_processor-spec.js'), 'const Processor = require(\'../asset/good_processor/processor.js\');');
        assert.fileContent(path.join(testPath, 'good_processor-spec.js'), '_op: \'good_processor\'');
    });
});
