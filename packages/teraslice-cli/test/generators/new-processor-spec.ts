import path from 'node:path';
import os from 'os';
import fs from 'fs-extra';
import assert from 'yeoman-assert';
// @ts-expect-error
import helpers from 'yeoman-test';

jest.setTimeout(10000);

describe('processor generator with no new flag', () => {
    const exampleAssetBasePath = fs.mkdtempSync(path.join(os.tmpdir(), 'generate-new-processor'));
    const processPath = path.join(exampleAssetBasePath, 'example-asset', 'asset');
    const testPath = path.join(exampleAssetBasePath, 'example-asset', 'test');
    const helpersPath = path.join(__dirname, '..', '..', 'src', 'generators', 'new-processor');

    beforeAll(() => helpers.run(helpersPath)
        .inDir(exampleAssetBasePath)
        .withOptions({ new: undefined })
        .withArguments(['example-asset']));

    afterAll(() => {
        fs.rmSync(exampleAssetBasePath, { recursive: true, force: true });
    });

    it('should generate index.js, processor.js, and schema.js in the asset dir', () => {
        assert.file([
            path.join(processPath, 'example', 'processor.js'),
            path.join(processPath, 'example', 'schema.js')
        ]);
    });

    it('should create a batch processor exporting ExampleProcessor class', () => {
        assert.fileContent([
            // @ts-expect-error
            [path.join(processPath, 'example', 'processor.js'), 'class Example extends BatchProcessor'],
            // @ts-expect-error
            [path.join(processPath, 'example', 'processor.js'), 'module.exports = Example;'],
            // @ts-expect-error
            [path.join(processPath, 'example', 'processor.js'), 'onBatch(dataArray)'],
            // @ts-expect-error
            [path.join(processPath, 'example', 'processor.js'), 'dataArray.forEach((doc) => {']
        ]);
    });

    it('should create an associated test', () => {
        assert.file(path.join(testPath, 'example-spec.js'));
        assert.fileContent([
            // @ts-expect-error
            [path.join(testPath, 'example-spec.js'), 'const Processor = require(\'../asset/example/processor.js\')'],
            // @ts-expect-error
            [path.join(testPath, 'example-spec.js'), '_op: \'example\''],
            // @ts-expect-error
            [path.join(testPath, 'example-spec.js'), 'add type to all the docs']
        ]);
    });
});

describe('processor generator with new flag', () => {
    const testAssetBasePath = fs.mkdtempSync(path.join(os.tmpdir(), 'generate-new-processor'));
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
        fs.rmSync(testAssetBasePath, { recursive: true, force: true });
    });

    it('should generate index.js, processor.js, and schema.js in the asset dir', () => {
        assert.file([
            path.join(processPath, 'good_processor', 'processor.js'),
            path.join(processPath, 'good_processor', 'schema.js')
        ]);
    });

    it('should generate a Map processor', () => {
        assert.fileContent([
            [path.join(processPath, 'good_processor', 'processor.js'), /class GoodProcessor extends MapProcessor/],
            [path.join(processPath, 'good_processor', 'processor.js'), /module\.exports = GoodProcessor;/],
            [path.join(processPath, 'good_processor', 'processor.js'), /map\(doc\)/]
        ]);
    });

    it('should generate an assiated spec file', () => {
        assert.file(path.join(testPath, 'good_processor-spec.js'));
        assert.fileContent(path.join(testPath, 'good_processor-spec.js'), 'const Processor = require(\'../asset/good_processor/processor.js\');');
        assert.fileContent(path.join(testPath, 'good_processor-spec.js'), '_op: \'good_processor\'');
    });
});
