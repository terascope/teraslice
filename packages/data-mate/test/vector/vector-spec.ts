import 'jest-fixtures';
import { FieldType } from '@terascope/types';
import { bigIntToJSON, newBuilder, Vector } from '../../src';

describe('Vector', () => {
    type Case = [type: FieldType, input: any[], output?: any[]];
    const nowDate = new Date();
    const now = nowDate.getTime();
    const testCases: Case[] = [
        [
            FieldType.Any,
            ['foo', 'bar', 1, 2, null, null]
        ],
        [
            FieldType.String,
            ['foo', 'bar', 1, 2, null, undefined],
            ['foo', 'bar', '1', '2', null, null]
        ],
        [
            FieldType.Float,
            [12.344, '2.01', BigInt(200), 1, 2, null, undefined],
            [12.344, 2.01, 200, 1, 2, null, null]
        ],
        [
            FieldType.Integer,
            [12.344, '2.01', BigInt(200), 1, 2, null, undefined],
            [12, 2, 200, 1, 2, null, null]
        ],
        [
            FieldType.Long,
            [12.344, '2.01', BigInt(200), 1, null, undefined],
            [BigInt(12), BigInt(2), BigInt(200), BigInt(1), null, null]
        ],
        [
            FieldType.Boolean,
            ['yes', 'no', true, false, 0, 1, null, undefined],
            [true, false, true, false, false, true, null, null]
        ],
        [
            FieldType.Date,
            [nowDate, nowDate.toISOString(), nowDate.getTime(), null, undefined],
            [now, now, now, null, null]
        ],
        [
            FieldType.GeoPoint,
            [[90, 60], ['90.123', '60.456'], { lat: '89.002', lon: '20.034990' }, null, undefined],
            [
                { lat: 60, lon: 90 },
                { lat: 60.456, lon: 90.123 },
                { lat: 89.002, lon: 20.034990 },
                null,
                null
            ]
        ],
    ];

    describe.each(testCases)('when field type is %s', (type, input, output) => {
        let vector: Vector<any>;
        let expected: any[];
        beforeAll(() => {
            const builder = newBuilder({ type, array: false });
            input.forEach((val) => builder.append(val));
            vector = builder.toVector();
            expected = (output ?? input).map((val) => {
                if (typeof val === 'bigint') {
                    return bigIntToJSON(val);
                }
                if (val === undefined) return null;
                return val;
            });
        });

        it('should return the correct output', () => {
            expect(vector.toJSON()).toEqual(expected);
        });

        it('should return have the correct size', () => {
            expect(vector.size).toBe(expected.length);
        });

        it('should have the correct distinct values', () => {
            expect(vector.distinct()).toBe(new Set(expected).size);
        });

        it('should have the correct field type', () => {
            expect(vector.fieldType).toBe(type);
        });

        it('should be an instance of a Vector', () => {
            expect(vector).toBeInstanceOf(Vector);
        });

        test.todo('should be immutable');
    });

    test.todo('->reduce');
    test.todo('->filter');
});
