import 'jest-extended';
import { promisify } from 'util';
import {
    Collector,
    DataEntity,
    times
} from '../src';

const delay = promisify(setTimeout);

describe('Collector', () => {
    let collector: Collector<DataEntity>;
    const config = {
        size: 100,
        wait: 100,
    };

    function getQueue(): DataEntity[] {
        // @ts-ignore
        return collector._queue;
    }

    beforeEach(() => {
        collector = new Collector(config);
    });

    describe('when given a batch equal to the target size', () => {
        it('should immeditially return the batch, nothing should be queued', () => {
            const data = times(config.size, (n) => ({ n }));
            const input = DataEntity.makeArray(data);
            collector.add(input);
            const result = collector.getBatch();

            expect(result).toEqual(input);
            expect(getQueue()).toBeArrayOfSize(0);
        });
    });

    describe('when given a batch less than the target size', () => {
        it('should eventually return the batch', () => {
            const data1 = times(config.size / 2, (n) => ({ n }));
            const input1 = DataEntity.makeArray(data1);
            collector.add(input1);

            const result1 = collector.getBatch();

            expect(result1).toBeNull();
            expect(getQueue()).toBeArrayOfSize(50);

            const data2 = times(config.size / 2, (n) => ({ n }));
            const input2 = DataEntity.makeArray(data2);
            collector.add(input2);

            const result2 = collector.getBatch();

            expect(result2).toBeArrayOfSize(config.size);
            expect(getQueue()).toBeArrayOfSize(0);
        });
    });

    describe('when given a more than the target size', () => {
        it('should immediately return the batch, the remainder should be queued', () => {
            const data1 = times(config.size * 1.5, (n) => ({ n }));
            const input1 = DataEntity.makeArray(data1);
            collector.add(input1);

            const result1 = collector.getBatch();

            expect(result1).toBeArrayOfSize(config.size);
            expect(getQueue()).toBeArrayOfSize(50);

            const data2 = times(config.size / 2, (n) => ({ n }));
            const input2 = DataEntity.makeArray(data2);
            collector.add(input2);

            const result2 = collector.getBatch();

            expect(result2).toBeArrayOfSize(config.size);
            expect(getQueue()).toBeArrayOfSize(0);
        });
    });

    describe('when a batch is partially enqueued and too much time passes', () => {
        it('should immediately return the batch, the remainder should be queued', async () => {
            const data1 = times(config.size / 2, (n) => ({ n }));
            const input1 = DataEntity.makeArray(data1);
            collector.add(input1);

            const result1 = collector.getBatch();

            expect(result1).toBeNull();
            expect(getQueue()).toBeArrayOfSize(50);

            await delay(150);

            collector.add([]);

            const result2 = collector.getBatch();

            expect(result2).toBeArrayOfSize(input1.length);
            expect(getQueue()).toBeArrayOfSize(0);
        });
    });

    describe('when calling flushAll', () => {
        it('should return all of the records', () => {
            const input = DataEntity.makeArray(times(config.size * 2, (n) => ({ n })));
            collector.add(input);

            const result = collector.flushAll();
            expect(result).toBeArrayOfSize(input.length);

            expect(getQueue()).toBeArrayOfSize(0);
        });
    });
});
