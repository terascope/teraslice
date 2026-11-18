import 'jest-extended';
import { TSError, parseErrorInfo } from '@terascope/core-utils';
import type { TerasliceApiV2 } from '@terascope/types';
import {
    createJobActiveQuery, addDeletedToQuery, getSliceTapOptions, makeTable,
    explainResultWindowError, printTable, printPagedTable
} from '../../src/lib/utils/api_utils.js';
import { paginationHeaders, paginationResponseHeaders } from '../../src/lib/utils/pagination.js';
import { makeResultWindowError } from './search-errors.js';

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

    describe('explainResultWindowError', () => {
        it('should match what OpenSearch errors parse to', () => {
            // guards the fixture: this is the message the real error produced
            expect(parseErrorInfo(makeResultWindowError()).message).toStartWith(
                'OpenSearch Error: Search Phase Execution: [Illegal Argument] Reason: Result Window Is Too Large'
            );
        });

        it('should replace the message, keeping the limit and the requested window', () => {
            const err = explainResultWindowError(makeResultWindowError(50000, 50100));

            expect(err).toBeInstanceOf(TSError);
            expect((err as TSError).statusCode).toBe(400);
            expect((err as TSError).message).toBe(
                'from + size must be less than or equal to 50000 (the index\'s max_result_window), '
                + 'got 50100. Use cursor to page further, or filter to narrow the search.'
            );
        });

        it('should still explain the error when the numbers are missing', () => {
            const err = explainResultWindowError(
                new TSError('Result window is too large', { statusCode: 400 })
            );

            expect((err as TSError).statusCode).toBe(400);
            expect((err as TSError).message).toBe(
                'from + size is larger than the index\'s max_result_window. Use cursor to page further, or filter to narrow the search.'
            );
        });

        it.each([
            ['a different 400', new TSError('Failed to parse query', { statusCode: 400 })],
            ['the same message with another status', new TSError('Result window is too large', { statusCode: 500 })],
            ['a plain Error', new Error('boom')],
        ])('should return %s unchanged', (_label, input) => {
            expect(explainResultWindowError(input)).toBe(input);
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

        it('should leave an empty list empty', () => {
            const data: Record<string, any>[] = [];
            makeTable(fakeReq(), ['name'], data);
            expect(data).toEqual([]);
        });

        it('should use fields and headers=false from the query', () => {
            const data = [{ name: 'a', id: 1 }];
            const lines = toLines(makeTable(fakeReq({ fields: 'id', headers: 'false' }), ['name', 'id'], data));

            expect(lines).toEqual(['1']);
        });
    });

    describe('printPagedTable', () => {
        const data = [{ name: 'a' }, { name: 'b' }];

        function page(
            records: Record<string, any>[],
            pagination: Partial<TerasliceApiV2.Pagination> = {}
        ): TerasliceApiV2.Page<Record<string, any>> {
            return {
                data: records,
                pagination: {
                    total: records.length,
                    from: 0,
                    size: 100,
                    has_more: false,
                    next_cursor: null,
                    ...pagination,
                },
            };
        }

        /** The lines after the table's blank separator line */
        function footer(output: string) {
            const lines = output.split('\n').slice(0, -1);
            return lines.slice(lines.lastIndexOf('') + 1);
        }

        it('should print the table, then which records are shown', () => {
            const output = printPagedTable({ page: page(data), fields: ['name'], headers: true });

            expect(output).toStartWith(printTable({ data, fields: ['name'], headers: true }));
            expect(footer(output)).toEqual(['Showing 1-2 of 2']);
        });

        it('should give the next page\'s cursor when there is one', () => {
            const output = printPagedTable({
                page: page(data, {
                    total: 1523, from: 100, size: 2, has_more: true, next_cursor: 'abc'
                }),
                fields: ['name'],
                headers: true,
            });

            expect(footer(output)).toEqual(['Showing 101-102 of 1,523', 'next: ?size=2&cursor=abc']);
        });

        it('should leave out next without a cursor', () => {
            const output = printPagedTable({
                page: page([], { total: 5, size: 0, has_more: true }),
                fields: ['name'],
                headers: true,
            });

            expect(footer(output)).toEqual(['Showing 0 of 5']);
        });

        it('should print an empty page as the column names and the footer', () => {
            const empty: Record<string, any>[] = [];
            const output = printPagedTable({
                page: page(empty, { total: 5, from: 10 }),
                fields: ['name'],
                headers: true,
            });

            expect(output.split('\n')[0].trim()).toBe('name');
            expect(footer(output)).toEqual(['Showing 0 of 5']);
            expect(empty).toEqual([]);
        });

        it('should print only rows with headers false', () => {
            const output = printPagedTable({
                page: page(data, { total: 10, has_more: true }),
                fields: ['name'],
                headers: false,
            });

            expect(output.split('\n').map((line) => line.trim())).toEqual(['a', 'b', '']);
        });
    });

    describe('paginationHeaders', () => {
        it('should give every documented header as a string', () => {
            const headers = paginationHeaders({
                total: 10000, from: 200, size: 100, has_more: true, next_cursor: 'abc'
            });

            expect(headers).toEqual({
                'X-Total-Count': '10000',
                'X-From': '200',
                'X-Size': '100',
                'X-Next-Cursor': 'abc',
            });
            expect(Object.keys(headers)).toEqual(Object.keys(paginationResponseHeaders));
        });

        it('should leave out X-Next-Cursor without a next cursor', () => {
            const headers = paginationHeaders({
                total: 10000, from: 9900, size: 100, has_more: false, next_cursor: null
            });

            expect(headers).not.toHaveProperty('X-Next-Cursor');
        });
    });
});
