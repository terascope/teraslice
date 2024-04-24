import 'jest-extended';
import { TestContext, newTestExecutionConfig, WorkerContext } from '../../src/index.js';
import Fetcher from '../../src/builtin/test-reader/fetcher.js';
import Slicer from '../../src/builtin/test-reader/slicer.js';
import Schema from '../../src/builtin/test-reader/schema.js';
import slicerData from '../../src/builtin/test-reader/data/slicer-data.js';
import fetcherData from '../../src/builtin/test-reader/data/fetcher-data.js';

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
            expect(result).toHaveProperty('fetcher_data_file_path', null);
            expect(result).toHaveProperty('slicer_data_file_path', null);
        });

        it('should be able to return the correct opConfig with additional config', () => {
            const result = schema.validate({
                _op: 'test-reader',
                fetcher_data_file_path: 'hello',
                slicer_data_file_path: 'hi',
            });
            expect(result).toHaveProperty('fetcher_data_file_path', 'hello');
            expect(result).toHaveProperty('slicer_data_file_path', 'hi');
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
        describe('Fetcher reads from file', () => {
            const context = new TestContext('test-reader');
            const opConfig = { _op: 'test-reader', passthrough_slice: false };
            const exConfig = newTestExecutionConfig();
            exConfig.lifecycle = 'once';

            let fetcher: Fetcher;

            beforeAll(async () => {
                fetcher = new Fetcher(
                    context as WorkerContext,
                    opConfig,
                    exConfig
                );

                await fetcher.initialize();
            });

            afterAll(async () => {
                await fetcher.shutdown();
            });

            it('should return the example data', async () => {
                const results1 = await fetcher.handle();
                expect(results1).toEqual(fetcherData);

                const results2 = await fetcher.handle();
                expect(results2).toEqual(fetcherData);
                expect(results2).not.toBe(results1);
            });
        });

        describe('Fetcher passes through data its given', () => {
            const context = new TestContext('test-reader');
            const opConfig = { _op: 'test-reader', passthrough_slice: true };
            const exConfig = newTestExecutionConfig();
            exConfig.lifecycle = 'once';

            let fetcher: Fetcher;

            beforeAll(async () => {
                fetcher = new Fetcher(
                    context as WorkerContext,
                    opConfig,
                    exConfig
                );

                await fetcher.initialize();
            });

            afterAll(async () => {
                await fetcher.shutdown();
            });

            it('should return a slice if given one', async () => {
                const data = [{ test: 'data' }, { other: 'data' }];
                const results = await fetcher.handle(data);

                expect(results).toEqual(data);
            });
        });
    });
});
