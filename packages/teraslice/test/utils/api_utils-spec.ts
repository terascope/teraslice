import 'jest-extended';
import {
    createJobActiveQuery, addDeletedToQuery, getSliceTraceOptions
} from '../../src/lib/utils/api_utils.js';

describe('apiUtils', () => {
    it('should be able to create the proper job queries', () => {
        let query: string;

        query = createJobActiveQuery('true');
        query = addDeletedToQuery('true', query);
        expect(query).toBe('job_id:* AND !active:false AND _deleted:true');

        query = createJobActiveQuery('true');
        query = addDeletedToQuery('', query);
        expect(query).toBe('job_id:* AND !active:false AND _deleted:true');

        query = createJobActiveQuery('true');
        query = addDeletedToQuery('false', query);
        expect(query).toBe('job_id:* AND !active:false AND (_deleted:false OR (* AND -_deleted:*))');

        query = createJobActiveQuery('false');
        query = addDeletedToQuery('true', query);
        expect(query).toBe('job_id:* AND active:false AND _deleted:true');

        query = createJobActiveQuery('false');
        query = addDeletedToQuery('', query);
        expect(query).toBe('job_id:* AND active:false AND _deleted:true');

        query = createJobActiveQuery('false');
        query = addDeletedToQuery('false', query);
        expect(query).toBe('job_id:* AND active:false AND (_deleted:false OR (* AND -_deleted:*))');
    });

    describe('getSliceTraceOptions', () => {
        it('should default size to 10', () => {
            expect(getSliceTraceOptions({})).toEqual({ size: 10 });
        });

        it.each([
            ['1', 1],
            ['250', 250],
            ['0', 0],
            ['all', 0],
            [' 5 ', 5],
        ])('should convert size=%j to %d', (size, expected) => {
            expect(getSliceTraceOptions({ size })).toEqual({ size: expected });
        });

        it.each([
            '-1',
            'abc',
            '',
            ' ',
            '2.5',
            'Infinity',
            'ALL',
            ['5', '5'],
            [''],
            { size: '5' },
        ])('should throw a 400 for size=%j', (size) => {
            let err: any;
            try {
                getSliceTraceOptions({ size } as any);
            } catch (_err) {
                err = _err;
            }

            expect(err).toBeDefined();
            expect(err.statusCode).toEqual(400);
            expect(err.message).toStartWith('Argument "size" must be "all", 0, or a positive integer');
            expect(err.message).toEndWith(`received ${JSON.stringify(size)}`);
        });
    });
});
