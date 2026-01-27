import 'jest-fixtures';
import { FieldType, Maybe } from '@terascope/types';
import {
    Column, dataFrameAdapter, functionConfigRepository, Vector
} from '../../src/index.js';

describe('Column (String Types)', () => {
    describe('when field type is Keyword', () => {
        let col: Column<string>;
        const values: Maybe<string>[] = [
            'Batman',
            'Robin',
            'Superman',
            null,
            'SpiderMan',
        ];
        beforeEach(() => {
            col = Column.fromJSON<string>('name', {
                type: FieldType.Keyword,
            }, values);
        });

        it('should have the correct size', () => {
            expect(col.size).toEqual(values.length);
        });

        it('should have the same id when forked with the same vector', () => {
            expect(col.fork(col.vector).id).toEqual(col.id);
        });

        it('should NOT have the same id when forked with a different vector', () => {
            const vector = col.vector.slice(0, 2);
            expect(col.fork(vector).id).not.toEqual(col.id);
        });

        it('should be able to iterate over the values', () => {
            expect([...col]).toEqual(values);
            expect(col.toJSON()).toEqual([
                'Batman',
                'Robin',
                'Superman',
                undefined,
                'SpiderMan',
            ]);
        });

        it('should be able to get the Vector', () => {
            expect(col.vector).toBeInstanceOf(Vector);
        });

        it('should be able to get unique with the same length', () => {
            const newCol = col.unique();
            expect(newCol.id).not.toBe(col.id);
            expect(newCol.size).toBe(col.size);
            expect(newCol.toJSON()).toEqual([
                'Batman',
                'Robin',
                'Superman',
                undefined,
                'SpiderMan',
            ]);
        });

        it('should be able to validate using isURL', () => {
            const newCol = dataFrameAdapter(
                functionConfigRepository.isURL,
            ).column(Column.fromJSON(col.name, col.config, [
                'https://someurl.cc.ru.ch',
                'ftp://someurl.bom:8080?some=bar&hi=bob',
                'http://xn--fsqu00a.xn--3lr804guic',
                'http://example.com',
                'BAD-URL',
                undefined,
            ]));

            expect(newCol.toJSON()).toEqual([
                'https://someurl.cc.ru.ch',
                'ftp://someurl.bom:8080?some=bar&hi=bob',
                'http://xn--fsqu00a.xn--3lr804guic',
                'http://example.com',
                undefined,
                undefined,
            ]);
        });

        it('should be able to validate using isUUID', () => {
            const newCol = dataFrameAdapter(
                functionConfigRepository.isUUID,
            ).column(Column.fromJSON(col.name, col.config, [
                '0668CF8B-27F8-2F4D-AF2D-763AC7C8F68B',
                'BAD-UUID',
                '6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b',
                undefined,
            ]));

            expect(newCol.toJSON()).toEqual([
                '0668CF8B-27F8-2F4D-AF2D-763AC7C8F68B',
                undefined,
                '6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b',
                undefined,
            ]);
        });

        it('should be able to validate using isEmail', () => {
            const newCol = dataFrameAdapter(
                functionConfigRepository.isEmail,
            ).column(Column.fromJSON(col.name, col.config, [
                'ha3ke5@pawnage.com',
                'user@blah.com/junk.junk?a=<tag value="junk"',
                'email@example.com',
                'email @ example.com',
                'example.com',
                null,
            ]));

            expect(newCol.toJSON()).toEqual([
                'ha3ke5@pawnage.com',
                undefined,
                'email@example.com',
                undefined,
                undefined,
                undefined,
            ]);
        });

        it('should be able to validate using isAlpha', () => {
            const newCol = dataFrameAdapter(
                functionConfigRepository.isAlpha,
            ).column(Column.fromJSON(col.name, col.config, [
                'Example',
                'example123',
                'foo bar',
                'ha3ke5@',
                'example.com',
                null,
            ]));

            expect(newCol.toJSON()).toEqual([
                'Example',
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
            ]);
        });

        it('should be able to validate using isAlphanumeric', () => {
            const newCol = dataFrameAdapter(
                functionConfigRepository.isAlphaNumeric,
            ).column(Column.fromJSON(col.name, col.config, [
                'Example',
                'example123',
                'foo bar',
                'ha3ke5@',
                'example.com',
                null,
            ]));

            expect(newCol.toJSON()).toEqual([
                'Example',
                'example123',
                undefined,
                undefined,
                undefined,
                undefined,
            ]);
        });

        it('should be able to validate using contains', () => {
            const newCol = dataFrameAdapter(
                functionConfigRepository.contains,
                {
                    args: { value: 'Super' }
                }
            ).column(col);

            expect(newCol.id).not.toBe(col.id);
            expect(newCol.config).toEqual(col.config);
            expect(newCol.toJSON()).toEqual([
                undefined,
                undefined,
                'Superman',
                undefined,
                undefined,
            ]);
        });

        it('should be able to transform using toUpperCase', () => {
            const newCol = dataFrameAdapter(
                functionConfigRepository.toUpperCase,
            ).column(col);

            expect(newCol.id).not.toBe(col.id);
            expect(newCol.config).toEqual(col.config);
            expect(newCol.toJSON()).toEqual([
                'BATMAN',
                'ROBIN',
                'SUPERMAN',
                undefined,
                'SPIDERMAN',
            ]);
        });

        it('should be able to transform using toLowerCase', () => {
            const newCol = dataFrameAdapter(
                functionConfigRepository.toLowerCase,
            ).column(col);

            expect(newCol.id).not.toBe(col.id);
            expect(newCol.config).toEqual(col.config);
            expect(newCol.toJSON()).toEqual([
                'batman',
                'robin',
                'superman',
                undefined,
                'spiderman',
            ]);
        });

        it('should be able to transform using truncate', () => {
            const newCol = dataFrameAdapter(
                functionConfigRepository.truncate,
                { args: { size: 5 } }
            ).column(col);

            expect(newCol.id).not.toBe(col.id);
            expect(newCol.config).toEqual(col.config);
            expect(newCol.toJSON()).toEqual([
                'Batma',
                'Robin',
                'Super',
                undefined,
                'Spide',
            ]);
        });

        it('should be able to transform using setDefault(value: "human")', () => {
            const newCol = dataFrameAdapter(
                functionConfigRepository.setDefault,
                { args: { value: 'human' } }
            ).column(col);

            expect(newCol.id).not.toBe(col.id);
            expect(newCol.config).toEqual(col.config);
            expect(newCol.toJSON()).toEqual([
                'Batman',
                'Robin',
                'Superman',
                'human',
                'SpiderMan',
            ]);
        });

        it('should be immutable', () => {
            expect(() => {
                // @ts-expect-error
                newCol.vector = 'hi' as any;
            }).toThrow();
        });
    });

    describe('when field type is Text (with whitespace)', () => {
        let col: Column<string>;
        const values: Maybe<string>[] = [
            '     left',
            'right    ',
            '  center ',
            '         ',
            'fast cars race fast',
            '.*.*a regex test.*.*.*.*',
            '\t\r\rexample\r\r',
        ];

        beforeEach(() => {
            col = Column.fromJSON<string>('txt', {
                type: FieldType.Text,
            }, values);
        });

        it('should be able to transform using trim()', () => {
            const newCol = dataFrameAdapter(
                functionConfigRepository.trim,
            ).column(col);

            expect(newCol.id).not.toBe(col.id);
            expect(newCol.config).toEqual(col.config);
            expect(newCol.toJSON()).toEqual([
                'left',
                'right',
                'center',
                '',
                'fast cars race fast',
                '.*.*a regex test.*.*.*.*',
                'example',
            ]);
        });

        it('should be able to transform using trim(char: "fast")', () => {
            const newCol = dataFrameAdapter(
                functionConfigRepository.trim,
                { args: { chars: 'fast' } }
            ).column(col);

            expect(newCol.id).not.toBe(col.id);
            expect(newCol.config).toEqual(col.config);
            expect(newCol.toJSON()).toEqual([
                '     le',
                'right    ',
                '  center ',
                '         ',
                ' cars race ',
                '.*.*a regex test.*.*.*.*',
                '\t\r\rexample\r\r',
            ]);
        });

        it('should be able to transform using trim(char: ".*")', () => {
            const newCol = dataFrameAdapter(
                functionConfigRepository.trim,
                { args: { chars: '.*' } }
            ).column(col);

            expect(newCol.id).not.toBe(col.id);
            expect(newCol.config).toEqual(col.config);
            expect(newCol.toJSON()).toEqual([
                '     left',
                'right    ',
                '  center ',
                '         ',
                'fast cars race fast',
                'a regex test',
                '\t\r\rexample\r\r',
            ]);
        });

        it('should be able to transform using trim(char: "\\r")', () => {
            const newCol = dataFrameAdapter(
                functionConfigRepository.trim,
                { args: { chars: '\r' } }
            ).column(col);

            expect(newCol.id).not.toBe(col.id);
            expect(newCol.config).toEqual(col.config);
            expect(newCol.toJSON()).toEqual([
                '     left',
                'right    ',
                '  center ',
                '         ',
                'fast cars race fast',
                '.*.*a regex test.*.*.*.*',
                '\t\r\rexample',
            ]);
        });

        it('should be able to transform using trimStart()', () => {
            const newCol = dataFrameAdapter(
                functionConfigRepository.trimStart,
            ).column(col);

            expect(newCol.id).not.toBe(col.id);
            expect(newCol.config).toEqual(col.config);
            expect(newCol.toJSON()).toEqual([
                'left',
                'right    ',
                'center ',
                '',
                'fast cars race fast',
                '.*.*a regex test.*.*.*.*',
                'example\r\r',
            ]);
        });

        it('should be able to transform using trimEnd()', () => {
            const newCol = dataFrameAdapter(
                functionConfigRepository.trimEnd,
            ).column(col);

            expect(newCol.id).not.toBe(col.id);
            expect(newCol.config).toEqual(col.config);
            expect(newCol.toJSON()).toEqual([
                '     left',
                'right',
                '  center',
                '',
                'fast cars race fast',
                '.*.*a regex test.*.*.*.*',
                '\t\r\rexample',
            ]);
        });
    });
});
