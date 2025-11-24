import 'jest-fixtures';
import { FieldType, Maybe } from '@terascope/types';
import { toBoolean } from '@terascope/core-utils';
import {
    Column, Vector,
    dataFrameAdapter, functionConfigRepository
} from '../../src/index.js';

describe('Column (Boolean Types)', () => {
    describe('when field type is Boolean', () => {
        let col: Column<boolean>;
        const values: Maybe<boolean>[] = [
            true,
            false,
            true,
            null,
            false,
        ];
        beforeEach(() => {
            col = Column.fromJSON<boolean>('active', {
                type: FieldType.Boolean,
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
            expect(col.toJSON()).toEqual([
                true,
                false,
                true,
                undefined,
                false,
            ]);
        });

        it('should be able to get the Vector', () => {
            expect(col.vector).toBeInstanceOf(Vector);
        });

        it('should be able to validate the values', () => {
            const newCol = dataFrameAdapter(
                functionConfigRepository.isBoolean,
            ).column(col);
            expect(newCol.id).not.toBe(col.id);
            expect(newCol.toJSON()).toEqual([
                true,
                false,
                true,
                undefined,
                false,
            ]);
        });

        it('should be able to get unique with the same length', () => {
            const newCol = col.unique();
            expect(newCol.id).not.toBe(col.id);
            expect(newCol.size).toBe(col.size);
            expect(newCol.toJSON()).toEqual([
                true,
                false,
                undefined,
                undefined,
                undefined,
            ]);
        });

        it('should be able to transform the column using toString', () => {
            const newCol = dataFrameAdapter(
                functionConfigRepository.toString,
            ).column(col);

            expect(newCol.id).not.toBe(col.id);
            expect(newCol.config).toEqual({
                ...col.config,
                type: FieldType.String
            });

            expect(newCol.toJSON()).toEqual(values.map((value) => {
                if (value == null) return undefined;
                return `${value}`;
            }));
        });
    });

    describe('when field type is Keyword', () => {
        let col: Column<string>;
        const values: Maybe<string>[] = [
            'True',
            'yes',
            'no',
            null,
            'NO',
            'False',
            'NOT_BOOLEAN',
            'WHO'
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
                'True',
                'yes',
                'no',
                undefined,
                'NO',
                'False',
                'NOT_BOOLEAN',
                'WHO'
            ]);
        });

        it('should be able to get the Vector', () => {
            expect(col.vector).toBeInstanceOf(Vector);
        });

        it('should be able to validate using isBoolean', () => {
            const newCol = dataFrameAdapter(
                functionConfigRepository.isBoolean,
            ).column(col);
            expect(newCol.id).not.toBe(col.id);
            expect(newCol.toJSON()).toEqual(
                values.map(() => undefined)
            );
        });

        it('should be able to validate using isBooleanLike', () => {
            const newCol = dataFrameAdapter(
                functionConfigRepository.isBooleanLike,
            ).column(col);
            expect(newCol.id).not.toBe(col.id);
            expect(newCol.toJSON()).toEqual([
                'True',
                'yes',
                'no',
                undefined,
                'NO',
                'False',
                undefined,
                undefined
            ]);
        });

        it('should be able to transform the column using toBoolean', () => {
            const newCol = dataFrameAdapter(
                functionConfigRepository.toBoolean,
            ).column(col);

            expect(newCol.id).not.toBe(col.id);
            expect(newCol.config).toEqual({
                ...col.config,
                type: FieldType.Boolean
            });
            expect(newCol.toJSON()).toEqual(values.map((value) => {
                if (value == null) return undefined;
                return toBoolean(value);
            }));
        });
    });

    describe('when field type is Keyword and is an array', () => {
        let col: Column<string[]>;
        const values: Maybe<string[]>[] = [
            ['True'],
            [],
            undefined,
            ['NO'],
            ['False'],
            ['NOT_BOOLEAN', 'True'],
            ['WHO']
        ];
        beforeEach(() => {
            col = Column.fromJSON<string[]>('name', {
                type: FieldType.Keyword,
                array: true
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
            expect(col.toJSON()).toEqual(values);
        });

        it('should be able to get the Vector', () => {
            expect(col.vector).toBeInstanceOf(Vector);
        });

        it('should be able to validate using isBoolean', () => {
            const newCol = dataFrameAdapter(
                functionConfigRepository.isBoolean,
            ).column(col);

            expect(newCol.id).not.toBe(col.id);
            expect(newCol.toJSON()).toEqual([
                [undefined],
                [],
                undefined,
                [undefined],
                [undefined],
                [undefined, undefined],
                [undefined]
            ]);
        });

        it('should be able to validate using isBooleanLike', () => {
            const newCol = dataFrameAdapter(
                functionConfigRepository.isBooleanLike,
            ).column(col);

            expect(newCol.id).not.toBe(col.id);
            expect(newCol.toJSON()).toEqual([
                ['True'],
                [],
                undefined,
                ['NO'],
                ['False'],
                [undefined, 'True'],
                [undefined]
            ]);
        });

        it('should be able to transform the column using toBoolean', () => {
            const newCol = dataFrameAdapter(
                functionConfigRepository.toBoolean,
            ).column(col);

            expect(newCol.id).not.toBe(col.id);
            expect(newCol.config).toEqual({
                ...col.config,
                type: FieldType.Boolean
            });

            expect(newCol.toJSON()).toEqual([
                [true],
                [],
                undefined,
                [false],
                [false],
                [true, true],
                [true]
            ]);
        });
    });
});
