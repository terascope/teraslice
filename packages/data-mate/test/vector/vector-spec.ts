import 'jest-extended';
import { toString, bigIntToJSON, isNotNil } from '@terascope/utils';
import {
    DataTypeFields,
    ESGeoShapeMultiPolygon,
    ESGeoShapePoint,
    ESGeoShapePolygon,
    ESGeoShapeType,
    FieldType, GeoShapeMultiPolygon, GeoShapePoint, GeoShapePolygon, GeoShapeType
} from '@terascope/types';
import {
    Builder, ReadableData, Vector, WritableData
} from '../../src';

describe('Vector', () => {
    type Case = [
        type: FieldType,
        input: any[],
        childConfig?: DataTypeFields,
        output?: any[],
        invalid?: any[]
    ];
    const nowDate = new Date();
    const now = nowDate.getTime();
    const testCases: Case[] = [
        [
            FieldType.Any,
            ['foo', 'bar', 1, 2, null, null]
        ],
        [
            FieldType.String,
            ['foo', 'bar', true, 1, 2, null, undefined],
            undefined,
            ['foo', 'bar', 'true', '1', '2', null, null],
            [{ foo: 'bar' }]
        ],
        [
            FieldType.Float,
            [12.344, '2.01', BigInt(200), 1, 2, null, undefined],
            undefined,
            [12.344, 2.01, 200, 1, 2, null, null]
        ],
        [
            FieldType.Integer,
            [12.344, '2.01', BigInt(200), 1, 2, null, undefined],
            undefined,
            [12, 2, 200, 1, 2, null, null],
            [-(2 ** 31) - 1, 2 ** 31 + 1, 'foo']
        ],
        [
            FieldType.Byte,
            [12.344, '2.01', -1, 2, null, undefined],
            undefined,
            [12, 2, -1, 2, null, null],
            [128, -129, 'bar']
        ],
        [
            FieldType.Short,
            [12.344, '-2.01', 1000, 2, null, undefined],
            undefined,
            [12, -2, 1000, 2, null, null],
            [32_768, -32_769, 'baz', '++1']
        ],
        [
            FieldType.Long,
            [12.344, '2.01', BigInt(200), 1, null, undefined],
            undefined,
            [BigInt(12), BigInt(2), BigInt(200), BigInt(1), null, null]
        ],
        [
            FieldType.Boolean,
            ['yes', 'no', true, false, 0, 1, null, undefined],
            undefined,
            [true, false, true, false, false, true, null, null],
            ['Y E S', 'foo', 23]
        ],
        [
            FieldType.Date,
            [nowDate, nowDate.toISOString(), now, '1941-08-20T07:00:00.000Z', null, undefined],
            undefined,
            [
                nowDate.toISOString(),
                nowDate.toISOString(),
                nowDate.toISOString(),
                '1941-08-20T07:00:00.000Z',
                null,
                null
            ],
            ['not a date', Number.NaN],
        ],
        [
            FieldType.IP,
            [
                '8.8.8.8',
                '192.172.1.18',
                '11.0.1.18',
                '2001:db8:85a3:8d3:1319:8a2e:370:7348',
                'fe80::1ff:fe23:4567:890a%eth2',
                '2001:DB8::1',
                '172.16.0.1',
                '10.168.0.1',
                'fc00:db8:85a3:8d3:1319:8a2e:370:7348',
                null,
                undefined
            ],
            undefined,
            [
                '8.8.8.8',
                '192.172.1.18',
                '11.0.1.18',
                '2001:db8:85a3:8d3:1319:8a2e:370:7348',
                'fe80::1ff:fe23:4567:890a%eth2',
                '2001:DB8::1',
                '172.16.0.1',
                '10.168.0.1',
                'fc00:db8:85a3:8d3:1319:8a2e:370:7348',
                null,
                null
            ]
        ],
        [
            FieldType.IPRange,
            [
                '1.2.3.4/32',
                '8.8.0.0/12',
                '2001:0db8:0123:4567:89ab:cdef:1234:5678/128',
                '2001::1234:5678/128',
                null,
                undefined
            ],
            undefined,
            [
                '1.2.3.4/32',
                '8.8.0.0/12',
                '2001:0db8:0123:4567:89ab:cdef:1234:5678/128',
                '2001::1234:5678/128',
                null,
                null
            ]
        ],
        [
            FieldType.GeoPoint,
            [[90, 60], ['90.123', '60.456'], { lat: '89.002', lon: '20.034990' }, null, undefined],
            undefined,
            [
                { lat: 60, lon: 90 },
                { lat: 60.456, lon: 90.123 },
                { lat: 89.002, lon: 20.034990 },
                null,
                null
            ],
        ],
        [
            FieldType.GeoJSON,
            [
                {
                    type: GeoShapeType.MultiPolygon,
                    coordinates: [
                        [
                            [[10, 10], [10, 50], [50, 50], [50, 10], [10, 10]],
                        ],
                        [
                            [[-10, -10], [-10, -50], [-50, -50], [-50, -10], [-10, -10]],
                        ]
                    ]
                } as GeoShapeMultiPolygon,
                {
                    type: GeoShapeType.Polygon,
                    coordinates: [
                        [[10, 10], [10, 50], [50, 50], [50, 10], [10, 10]],
                    ]
                } as GeoShapePolygon,
                {
                    type: GeoShapeType.Polygon,
                    coordinates: [
                        [[10, 10], [10, 50], [50, 50], [50, 10], [10, 10]],
                        [[20, 20], [20, 40], [40, 40], [40, 20], [20, 20]]
                    ]
                } as GeoShapePolygon,
                {
                    type: GeoShapeType.Point,
                    coordinates: [12, 12]
                } as GeoShapePoint,
                null,
                undefined
            ],
            undefined,
        ],
        [
            FieldType.GeoJSON,
            [
                {
                    type: ESGeoShapeType.MultiPolygon,
                    coordinates: [
                        [
                            [[10, 10], [10, 50], [50, 50], [50, 10], [10, 10]],
                        ],
                        [
                            [[-10, -10], [-10, -50], [-50, -50], [-50, -10], [-10, -10]],
                        ]
                    ]
                } as ESGeoShapeMultiPolygon,
                {
                    type: ESGeoShapeType.Polygon,
                    coordinates: [
                        [[10, 10], [10, 50], [50, 50], [50, 10], [10, 10]],
                    ]
                } as ESGeoShapePolygon,
                {
                    type: ESGeoShapeType.Point,
                    coordinates: [12, 12]
                } as ESGeoShapePoint,
                null,
                undefined
            ],
            undefined,
            [
                {
                    type: GeoShapeType.MultiPolygon,
                    coordinates: [
                        [
                            [[10, 10], [10, 50], [50, 50], [50, 10], [10, 10]],
                        ],
                        [
                            [[-10, -10], [-10, -50], [-50, -50], [-50, -10], [-10, -10]],
                        ]
                    ]
                } as GeoShapeMultiPolygon,
                {
                    type: GeoShapeType.Polygon,
                    coordinates: [
                        [[10, 10], [10, 50], [50, 50], [50, 10], [10, 10]],
                    ]
                } as GeoShapePolygon,
                {
                    type: GeoShapeType.Point,
                    coordinates: [12, 12]
                } as GeoShapePoint,
                null,
                null
            ],
        ],
        [
            FieldType.Object,
            [
                { foo: 'bar', other: { 1: 2 }, arr: [1, 2, 3] },
                { field1: null, field2: undefined },
                {},
                null,
                undefined
            ],
            undefined,
            [
                { foo: 'bar', other: { 1: 2 }, arr: [1, 2, 3] },
                { field1: null, field2: undefined },
                {},
                null,
                null
            ],
            [
                [],
                'foo',
            ],
        ],
        [
            FieldType.Tuple,
            [
                [true, 'hi', 3],
                ['FALSE', 2, 1.1],
                [null, undefined, null],
                [null, 'hello', undefined],
                [],
                null,
                undefined
            ],
            {
                0: { type: FieldType.Boolean },
                1: { type: FieldType.String },
                2: { type: FieldType.Integer },
            },
            [
                [true, 'hi', 3],
                [false, '2', 1],
                [undefined, undefined, undefined],
                [undefined, 'hello', undefined],
                [undefined, undefined, undefined],
                undefined,
                undefined
            ],
            [
                [true, 'hi', 'hello', 'extra-arg'],
                ['not a boolean'],
                'foo',
                { hi: true },
                0
            ],
        ],
    ];

    describe.each(testCases)('when field type is %s', (type, input, childConfig, output, invalid) => {
        let vector: Vector<any>;
        let expected: any[];
        beforeAll(() => {
            const builder = Builder.make(new WritableData(input.length), {
                childConfig,
                config: { type, array: false },
            });
            input.forEach((val) => builder.append(val));
            vector = builder.toVector();
            expected = (output ?? input).map((val) => {
                if (typeof val === 'bigint') {
                    return bigIntToJSON(val);
                }
                if (val == null) return undefined;
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
            const unique = new Set(
                expected.filter(isNotNil).map(toString)
            );
            expect(vector.countUnique()).toBe(unique.size);
        });

        it('should have the correct field config', () => {
            expect(vector.config).toEqual({
                type,
                array: false
            });
        });

        describe('when appended to itself', () => {
            let appended: Vector<any>;
            let newData: ReadableData<any>;

            beforeAll(() => {
                newData = new ReadableData(vector.data[0].toWritable());
                appended = vector.append(newData);
            });

            it('should be have doubled in size', () => {
                expect(appended.size).toEqual(expected.length * 2);
            });

            it('should be able to find the first half of the data', () => {
                const found = appended.findDataWithIndex(1);
                if (found == null) {
                    expect(found).not.toBeNil();
                    return;
                }

                // this can't use toBe because jest throw cannot serialize bigint errors
                expect(found[0] === vector.data[0]).toBeTrue();
                expect(found[1]).toBe(1);
            });

            it('should be able to find the second half of the data', () => {
                const found = appended.findDataWithIndex(vector.size);
                if (found == null) {
                    expect(found).not.toBeNil();
                    return;
                }

                // this can't use toBe because jest throw cannot serialize bigint errors
                expect(found[0] === newData).toBeTrue();
                expect(found[1]).toBe(0);
            });

            it('should be able return double the output', () => {
                expect(appended.toJSON()).toEqual(
                    expected.concat(expected)
                );
            });

            it('should be able to slice the results to 1', () => {
                expect(appended.slice(0, 1).size).toBe(1);
            });

            it('should be able to slice the results to the last item', () => {
                expect(appended.slice(-1).size).toBe(1);
            });

            it('should be able to slice the first half', () => {
                expect(appended.slice(vector.size).size).toBe(vector.size);
            });

            it('should be able to slice the second half', () => {
                expect(appended.slice(0, vector.size).size).toBe(vector.size);
            });
        });

        if (invalid?.length) {
            test.each(invalid)('should NOT be able to parse %p', (val) => {
                const builder = Builder.make(new WritableData(invalid.length), {
                    config: {
                        type, array: false
                    },
                    childConfig
                });
                expect(() => {
                    builder.append(val);
                }).toThrowError();
            });
        }

        it('should be an instance of a Vector', () => {
            expect(vector).toBeInstanceOf(Vector);
        });

        it('should be immutable', () => {
            expect(() => {
                // @ts-expect-error
                vector.data[0].values = '10';
            }).toThrow();
        });
    });
});
