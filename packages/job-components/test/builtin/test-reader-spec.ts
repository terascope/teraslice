import 'jest-extended';
import fs from 'fs';
import path from 'path';
import { TestContext, newTestExecutionConfig, WorkerContext } from '../../src';
import Fetcher from '../../src/builtin/test-reader/fetcher';
import Slicer from '../../src/builtin/test-reader/slicer';
import Schema from '../../src/builtin/test-reader/schema';

const readerPath = path.join(__dirname, '..', '..', 'src', 'builtin', 'test-reader');

const slicerDataFilePath = path.join(readerPath, 'data', 'slicer-data.json');
const slicerData = JSON.parse(fs.readFileSync(slicerDataFilePath, 'utf8'));

const fetcherDataFilePath = path.join(readerPath, 'data', 'fetcher-data.json');
const fetcherData = JSON.parse(fs.readFileSync(fetcherDataFilePath, 'utf8'));

describe('Test Reader', () => {
    it('should have a Schema, Fetcher and Slicer class', () => {
        expect(Fetcher).not.toBeNil();
        expect(Slicer).not.toBeNil();
        expect(Schema).not.toBeNil();
    });

    describe('when using the Schema', () => {
        const context = new TestContext('test-reader');
        const schema = new Schema(context);

        it('should be able to return the correct opConfig with not additional config', () => {
            const result = schema.validate({ _op: 'test-reader' });
            expect(result).toHaveProperty('fetcherDataFilePath', null);
            expect(result).toHaveProperty('slicerDataFilePath', null);
        });

        it('should be able to return the correct opConfig with additional config', () => {
            const result = schema.validate({
                _op: 'test-reader',
                fetcherDataFilePath: 'hello',
                slicerDataFilePath: 'hi',
            });
            expect(result).toHaveProperty('fetcherDataFilePath', 'hello');
            expect(result).toHaveProperty('slicerDataFilePath', 'hi');
        });
    });

    describe('when using the Slicer', () => {
        const context = new TestContext('test-reader');
        const opConfig = { _op: 'test-reader' };
        const exConfig = newTestExecutionConfig();
        exConfig.lifecycle = 'once';

        const slicer = new Slicer(
            context as WorkerContext,
            opConfig,
            exConfig
        );

        beforeAll(() => slicer.initialize([]));
        afterAll(() => slicer.shutdown());

        it('should return the example data', async () => {
            let done = false;
            while (!done) {
                done = await slicer.handle();
            }
            const slices = slicer.getSlices(10000);
            expect(slices.map((s) => s.request)).toEqual(slicerData);
        });
    });

    describe('when using the Fetcher', () => {
        const context = new TestContext('test-reader');
        const opConfig = { _op: 'test-reader' };
        const exConfig = newTestExecutionConfig();
        exConfig.lifecycle = 'once';

        const fetcher = new Fetcher(
            context as WorkerContext,
            opConfig,
            exConfig
        );

        beforeAll(() => fetcher.initialize());
        afterAll(() => fetcher.shutdown());

        it('should return the example data', async () => {
            const results1 = await fetcher.handle();
            expect(results1).toEqual(fetcherData);

            const results2 = await fetcher.handle();
            expect(results2).toEqual(fetcherData);
            expect(results2).not.toBe(results1);
        });
    });
});
