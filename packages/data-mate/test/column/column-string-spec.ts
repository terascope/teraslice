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
            const newCol = col.validate(ColumnValidator.isURL);
            expect(newCol.id).not.toBe(col.id);
            expect(newCol.toJSON()).toEqual(values.map(() => null));
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
