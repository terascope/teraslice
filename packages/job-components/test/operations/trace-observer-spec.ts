import 'jest-extended';
import { DataEntity, times } from '@terascope/core-utils';
import {
    TestContext, newTestExecutionConfig, Context,
    TraceObserver
} from '../../src/index.js';

describe('TraceObserver', () => {
    let observer: TraceObserver;

    const context = new TestContext('teraslice-operations') as Context;
    const exConfig = newTestExecutionConfig();
    exConfig.operations = [
        {
            _op: 'fetcher'
        },
        {
            _op: 'processor'
        }
    ];

    function makeRecords(count: number, prefix = 'record') {
        return times(count, (i) => DataEntity.make(
            { id: `${prefix}-${i}`, nested: { value: i } },
            { _key: `${prefix}-${i}` }
        ));
    }

    function getPending() {
        return (observer as any).pending;
    }

    function startTrace(size: number, timeoutMs = 2000) {
        return observer.getTrace(size, timeoutMs);
    }

    beforeEach(() => {
        observer = new TraceObserver(context, { _name: 'trace-observer' }, exConfig);
        return observer.initialize();
    });

    afterEach(() => observer.shutdown());

    it('should not have a pending trace by default', () => {
        expect(getPending()).toBeNull();
    });

    it('should ignore slice events when no trace is pending', () => {
        observer.onSliceInitialized('slice-1');
        observer.onOperationComplete('slice-1', 0, 5, makeRecords(5));
        observer.onSliceFinalizing('slice-1');
        observer.onSliceFailed('slice-1');

        expect(getPending()).toBeNull();
    });

    it('should collect the records and metadata for each operation of the next slice', async () => {
        const promise = startTrace(10);

        const fetched = makeRecords(3);
        const processed = makeRecords(2, 'processed');

        observer.onSliceInitialized('slice-1');
        observer.onOperationComplete('slice-1', 0, fetched.length, fetched);
        observer.onOperationComplete('slice-1', 1, processed.length, processed);
        observer.onSliceFinalizing('slice-1');

        const result = await promise;

        expect(result.sliceId).toEqual('slice-1');
        expect(result.records).toBeArrayOfSize(2);
        expect(result.records[0]).toEqual(fetched.map((record) => ({
            record: { ...record },
            metadata: record.getMetadata()
        })));
        expect(result.records[1]).toEqual(processed.map((record) => ({
            record: { ...record },
            metadata: record.getMetadata()
        })));
        expect(getPending()).toBeNull();
    });

    it('should return plain copies unaffected by later record mutation', async () => {
        const promise = startTrace(10);

        const records = makeRecords(1);

        observer.onSliceInitialized('slice-1');
        observer.onOperationComplete('slice-1', 0, records.length, records);

        records[0].nested.value = 'mutated';
        records[0].setMetadata('_key', 'mutated');

        observer.onSliceFinalizing('slice-1');

        const result = await promise;

        expect(DataEntity.isDataEntity(result.records[0][0].record)).toBeFalse();
        expect(result.records[0][0].record.nested.value).toEqual(0);
        expect(result.records[0][0].metadata._key).toEqual('record-0');
    });

    it('should return exactly size records per operation', async () => {
        const promise = startTrace(3);

        observer.onSliceInitialized('slice-1');
        observer.onOperationComplete('slice-1', 0, 10, makeRecords(10));
        observer.onOperationComplete('slice-1', 1, 2, makeRecords(2));
        observer.onSliceFinalizing('slice-1');

        const result = await promise;

        expect(result.records[0]).toBeArrayOfSize(3);
        expect(result.records[0].map(({ record }) => record.id)).toEqual([
            'record-0', 'record-1', 'record-2'
        ]);
        // fewer records than size returns what exists
        expect(result.records[1]).toBeArrayOfSize(2);
    });

    it('should return all records when size is 0', async () => {
        const promise = startTrace(0);

        observer.onSliceInitialized('slice-1');
        observer.onOperationComplete('slice-1', 0, 250, makeRecords(250));
        observer.onSliceFinalizing('slice-1');

        const result = await promise;

        expect(result.records[0]).toBeArrayOfSize(250);
    });

    it('should return an empty array for an operation with no records', async () => {
        const promise = startTrace(10);

        observer.onSliceInitialized('slice-1');
        observer.onOperationComplete('slice-1', 0, 3, makeRecords(3));
        observer.onOperationComplete('slice-1', 1, 0, []);
        observer.onSliceFinalizing('slice-1');

        const result = await promise;

        expect(result.records[0]).toBeArrayOfSize(3);
        expect(result.records[1]).toEqual([]);
    });

    it('should reject when the traced slice fails', async () => {
        const promise = startTrace(10);

        observer.onSliceInitialized('slice-1');
        observer.onOperationComplete('slice-1', 0, 2, makeRecords(2));
        observer.onSliceFailed('slice-1');

        await expect(promise).rejects.toThrow('slice slice-1 failed before completing');
        expect(getPending()).toBeNull();
    });

    it('should reject when no slice completes before the timeout', async () => {
        const promise = startTrace(10, 500);

        await expect(promise).rejects.toThrow('no slice completed in time');
        expect(getPending()).toBeNull();
    });

    it('should reject when the slice starts but does not finish before the timeout', async () => {
        const promise = startTrace(10, 500);

        observer.onSliceInitialized('slice-1');
        observer.onOperationComplete('slice-1', 0, 2, makeRecords(2));

        await expect(promise).rejects.toThrow('no slice completed in time');
        expect(getPending()).toBeNull();
    });

    it('should reject when the worker shuts down mid trace', async () => {
        const promise = startTrace(10);

        observer.onSliceInitialized('slice-1');
        await observer.shutdown();

        await expect(promise).rejects.toThrow('worker shut down before the slice completed');
        expect(getPending()).toBeNull();
    });

    it('should reject a second concurrent trace without disturbing the first', async () => {
        const first = startTrace(10);

        await expect(observer.getTrace(10, 2000)).rejects.toThrow(
            'A slice trace is already in progress for this worker'
        );

        observer.onSliceInitialized('slice-1');
        observer.onOperationComplete('slice-1', 0, 1, makeRecords(1));
        observer.onSliceFinalizing('slice-1');

        await expect(first).resolves.toHaveProperty('sliceId', 'slice-1');
    });

    it('should allow a new trace after the previous one finishes', async () => {
        const first = startTrace(10, 500);
        await expect(first).rejects.toThrow();

        const second = startTrace(10);

        observer.onSliceInitialized('slice-2');
        observer.onOperationComplete('slice-2', 0, 1, makeRecords(1));
        observer.onSliceFinalizing('slice-2');

        await expect(second).resolves.toHaveProperty('sliceId', 'slice-2');
        expect(getPending()).toBeNull();
    });
});
