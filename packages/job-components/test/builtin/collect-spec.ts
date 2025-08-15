import 'jest-extended';
import { promisify } from 'node:util';
import { DataEntity, times } from '@terascope/utils';
import {
    TestContext, newTestExecutionConfig, Context,
} from '../../src/index.js';
import Collect from '../../src/builtin/collect/processor.js';
import Schema from '../../src/builtin/collect/schema.js';

const delay = promisify(setTimeout);

describe('Collect Processor', () => {
    const opConfig = {
        _op: 'collect',
        size: 100,
        wait: 100
    };

    const exConfig = newTestExecutionConfig();
    let context: Context;
    let collect: Collect;

    // @ts-expect-error
    const getQueue = (): DataEntity[] => collect.collector._queue;
    beforeEach(() => {
        context = new TestContext('collect') as Context;
        collect = new Collect(context, opConfig, exConfig);
    });

    it('should have a Schema and Processor class', () => {
        expect(Collect).not.toBeNil();
        expect(Schema).not.toBeNil();
    });

    it('should be able to pass validation', () => {
        const schema = new Schema(context);
        const result = schema.validate({
            _op: 'collect',
            size: 100,
            wait: 100
        });
        expect(result).toHaveProperty('wait', 100);
        expect(result).toHaveProperty('size', 100);
    });

    it('should be able to fail validation', () => {
        const schema = new Schema(context);
        expect(() => {
            schema.validate({
                _op: 'collect',
            });
        }).toThrow();
    });

    describe('when given a batch equal to the target size', () => {
        it('should immeditially resolve the slice, nothing should be queued', async () => {
            const data = times(opConfig.size, (n) => ({ n }));
            const input = DataEntity.makeArray(data);
            const result = await collect.handle(input);

            expect(result).toEqual(input);
            expect(getQueue()).toBeArrayOfSize(0);
        });
    });

    describe('when given a batch less than the target size', () => {
        it('should eventually resolve the slice', async () => {
            const data1 = times(opConfig.size / 2, (n) => ({ n }));
            const input1 = DataEntity.makeArray(data1);
            const result1 = await collect.handle(input1);

            expect(result1).toBeArrayOfSize(0);
            expect(getQueue()).toBeArrayOfSize(50);

            const data2 = times(opConfig.size / 2, (n) => ({ n }));
            const input2 = DataEntity.makeArray(data2);
            const result2 = await collect.handle(input2);

            expect(result2).toBeArrayOfSize(opConfig.size);
            expect(getQueue()).toBeArrayOfSize(0);
        });
    });

    describe('when given a more than the target size', () => {
        it('should immediately resolve the slice, the remainder should be queued', async () => {
            const data1 = times(opConfig.size * 1.5, (n) => ({ n }));
            const input1 = DataEntity.makeArray(data1);
            const result1 = await collect.handle(input1);

            expect(result1).toBeArrayOfSize(opConfig.size);
            expect(getQueue()).toBeArrayOfSize(50);

            const data2 = times(opConfig.size / 2, (n) => ({ n }));
            const input2 = DataEntity.makeArray(data2);
            const result2 = await collect.handle(input2);

            expect(result2).toBeArrayOfSize(opConfig.size);
            expect(getQueue()).toBeArrayOfSize(0);
        });
    });

    describe('when a slice is partially enqueued and too much time passes', () => {
        it('should immediately resolve the slice, the remainder should be queued', async () => {
            const data1 = times(opConfig.size / 2, (n) => ({ n }));
            const input1 = DataEntity.makeArray(data1);
            const result1 = await collect.handle(input1);

            expect(result1).toBeArrayOfSize(0);
            expect(getQueue()).toBeArrayOfSize(50);

            await delay(150);

            const result2 = await collect.handle([]);

            expect(result2).toBeArrayOfSize(input1.length);
            expect(getQueue()).toBeArrayOfSize(0);
        });
    });

    describe('when shutting down', () => {
        it('should reject with an error if there are queued records', async () => {
            const input = DataEntity.makeArray(times(opConfig.size / 2, (n) => ({ n })));
            await collect.handle(input);

            return expect(collect.shutdown()).rejects.toThrow(`Collect is shutdown with ${opConfig.size / 2} unprocessed records`);
        });

        it('should resolve when there are no queued records', async () => expect(collect.shutdown()).resolves.toBeNil());
    });
});
