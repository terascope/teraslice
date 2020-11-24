import 'jest-fixtures';
import { FieldType, Maybe } from '@terascope/types';
import {
    ColumnValidator,
    Column, ColumnTransform, Vector
} from '../../src';

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
            expect(col.toJSON()).toEqual(values);
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
                null,
                'SpiderMan',
            ]);
        });

        it('should be able to validate using isURL', () => {
            const newCol = Column.fromJSON(col.name, col.config, [
                'https://someurl.cc.ru.ch',
                'ftp://someurl.bom:8080?some=bar&hi=bob',
                'http://xn--fsqu00a.xn--3lr804guic',
                'http://example.com',
                'BAD-URL',
                null,
            ]).validate(ColumnValidator.isURL);

            expect(newCol.toJSON()).toEqual([
                'https://someurl.cc.ru.ch',
                'ftp://someurl.bom:8080?some=bar&hi=bob',
                'http://xn--fsqu00a.xn--3lr804guic',
                'http://example.com',
                null,
                null,
            ]);
        });

        it('should be able to validate using isUUID', () => {
            const newCol = Column.fromJSON(col.name, col.config, [
                '0668CF8B-27F8-2F4D-4F2D-763AC7C8F68B',
                'BAD-UUID',
                '6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b',
                null,
            ]).validate(ColumnValidator.isUUID);

            expect(newCol.toJSON()).toEqual([
                '0668CF8B-27F8-2F4D-4F2D-763AC7C8F68B',
                null,
                '6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b',
                null,
            ]);
        });

        it('should be able to validate using isEmail', () => {
            const newCol = Column.fromJSON(col.name, col.config, [
                'ha3ke5@pawnage.com',
                'user@blah.com/junk.junk?a=<tag value="junk"',
                'email@example.com',
                'email @ example.com',
                'example.com',
                null,
            ]).validate(ColumnValidator.isEmail);

            expect(newCol.toJSON()).toEqual([
                'ha3ke5@pawnage.com',
                'user@blah.com/junk.junk?a=<tag value="junk"',
                'email@example.com',
                null,
                null,
                null,
            ]);
        });

        it('should be able to validate using isEqual', () => {
            const newCol = col.validate(ColumnValidator.isEqual, {
                value: 'Superman'
            });

            expect(newCol.id).not.toBe(col.id);
            expect(newCol.config).toEqual(col.config);
            expect(newCol.toJSON()).toEqual([
                null,
                null,
                'Superman',
                null,
                null,
            ]);
        });

        it('should be able to transform using cast(array: true)', () => {
            const newCol = col.transform(ColumnTransform.cast, {
                array: true
            });

            expect(newCol.id).not.toBe(col.id);
            expect(newCol.config).toEqual({ ...col.config, array: true });
            expect(newCol.toJSON()).toEqual([
                ['Batman'],
                ['Robin'],
                ['Superman'],
                null,
                ['SpiderMan'],
            ]);
        });

        it('should be able to transform using toUpperCase', () => {
            const newCol = col.transform(ColumnTransform.toUpperCase);

            expect(newCol.id).not.toBe(col.id);
            expect(newCol.config).toEqual(col.config);
            expect(newCol.toJSON()).toEqual([
                'BATMAN',
                'ROBIN',
                'SUPERMAN',
                null,
                'SPIDERMAN',
            ]);
        });

        it('should be able to transform using toLowerCase', () => {
            const newCol = col.transform(ColumnTransform.toLowerCase);

            expect(newCol.id).not.toBe(col.id);
            expect(newCol.config).toEqual(col.config);
            expect(newCol.toJSON()).toEqual([
                'batman',
                'robin',
                'superman',
                null,
                'spiderman',
            ]);
        });

        it('should be able to transform using truncate', () => {
            const newCol = col.transform(ColumnTransform.truncate, {
                size: 5
            });

            expect(newCol.id).not.toBe(col.id);
            expect(newCol.config).toEqual(col.config);
            expect(newCol.toJSON()).toEqual([
                'Batma',
                'Robin',
                'Super',
                null,
                'Spide',
            ]);
        });

        it('should be able to transform using setDefault(value: "human")', () => {
            const newCol = col.transform(ColumnTransform.setDefault, {
                value: 'human'
            });

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
            const newCol = col.transform(ColumnTransform.trim);

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
            const newCol = col.transform(ColumnTransform.trim, {
                char: 'fast'
            });

            expect(newCol.id).not.toBe(col.id);
            expect(newCol.config).toEqual(col.config);
            expect(newCol.toJSON()).toEqual([
                '     left',
                'right    ',
                '  center ',
                '         ',
                ' cars race ',
                '.*.*a regex test.*.*.*.*',
                '\t\r\rexample\r\r',
            ]);
        });

        it('should be able to transform using trim(char: ".*")', () => {
            const newCol = col.transform(ColumnTransform.trim, {
                char: '.*'
            });

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
            const newCol = col.transform(ColumnTransform.trim, {
                char: '\r'
            });

            expect(newCol.id).not.toBe(col.id);
            expect(newCol.config).toEqual(col.config);
            expect(newCol.toJSON()).toEqual([
                '     left',
                'right    ',
                '  center ',
                '         ',
                'fast cars race fast',
                '.*.*a regex test.*.*.*.*',
                'example',
            ]);
        });

        it('should be able to transform using trimStart()', () => {
            const newCol = col.transform(ColumnTransform.trimStart);

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
            const newCol = col.transform(ColumnTransform.trimEnd);

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
