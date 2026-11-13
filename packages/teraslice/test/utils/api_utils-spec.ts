import 'jest-extended';
import {
    createJobActiveQuery, addDeletedToQuery, getSliceTapOptions, makeTable
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

    describe('getSliceTapOptions', () => {
        it('should default size to 10', () => {
            expect(getSliceTapOptions({})).toEqual({ size: 10 });
        });

        it.each([
            ['1', 1],
            ['250', 250],
            ['0', 0],
            ['all', 0],
            [' 5 ', 5],
        ])('should convert size=%j to %d', (size, expected) => {
            expect(getSliceTapOptions({ size })).toEqual({ size: expected });
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
                getSliceTapOptions({ size } as any);
            } catch (_err) {
                err = _err;
            }

            expect(err).toBeDefined();
            expect(err.statusCode).toEqual(400);
            expect(err.message).toStartWith('Argument "size" must be "all", 0, or a positive integer');
            expect(err.message).toEndWith(`received ${JSON.stringify(size)}`);
        });
    });

    describe('makeTable', () => {
        function fakeReq(query: Record<string, string> = {}) {
            return { query } as any;
        }

        /** The table's lines with padding trimmed; the output ends with a newline */
        function toLines(table: string) {
            return table.split('\n').slice(0, -1)
                .map((line) => line.trim());
        }

        it('should print a row per record with the default columns', () => {
            const data = [{ name: 'a', id: 1 }, { name: 'b', id: 2 }];

            const lines = toLines(makeTable(fakeReq(), ['name', 'id'], data));

            expect(lines).toHaveLength(4);
            expect(lines[0]).toMatch(/^name\s+id$/);
            expect(lines[2]).toMatch(/^a\s+1$/);
            expect(lines[3]).toMatch(/^b\s+2$/);
        });

        it('should print only the header for an empty list', () => {
            const lines = toLines(makeTable(fakeReq(), ['name', 'id'], []));

            expect(lines).toHaveLength(3);
            expect(lines[0]).toMatch(/^name\s+id$/);
            expect(lines[2]).toBe('');
        });
    });
});
