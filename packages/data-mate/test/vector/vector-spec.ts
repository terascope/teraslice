import 'jest-extended';
import {
    toString, bigIntToJSON, isNotNil, times
} from '@terascope/core-utils';
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
} from '../../src/index.js';

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
            [12.344, '2.01', BigInt(246071665871), 1, 2, null, undefined],
            undefined,
            [12, 2, 246071665871, 1, 2, null, null],
            ['foo']
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
            [
                nowDate,
                nowDate.toISOString(),
                now,
                '1941-08-20T07:00:00.000Z',
                null,
                undefined,
                [1693412879005, 420]
            ],
            undefined,
            [
                nowDate.toISOString(),
                nowDate.toISOString(),
                nowDate.toISOString(),
                '1941-08-20T07:00:00.000Z',
                null,
                null,
                '2023-08-30T23:27:59.005+07:00'
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
            FieldType.Boundary,
            [[[90, 60], ['90.123', '60.456']], null, undefined],
            undefined,
            [
                [{ lat: 60, lon: 90 }, { lat: 60.456, lon: 90.123 }],
                null,
                null
            ],
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

        it('should be able to detect when there are non-nil values', () => {
            expect(vector.hasNilValues()).toEqual(expected.some((value) => value == null));
        });

        it('should be able to detect count the non-nil values', () => {
            expect(vector.countValues()).toEqual(expected.reduce((acc, value) => {
                if (value == null) return acc;
                return acc + 1;
            }, 0));
        });

        it('should be able to detect if the vector is empty', () => {
            expect(vector.isEmpty()).toBeFalse();
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

            describe('when appended to itself again', () => {
                let appended2: Vector<any>;
                let newData2: ReadableData<any>;

                beforeAll(() => {
                    newData2 = new ReadableData(appended.data[1].toWritable());
                    appended2 = appended.append(newData2);
                });

                it('should be have tripled in size', () => {
                    expect(appended2.size).toEqual(expected.length * 3);
                });

                it('should be able to find the first half of the data', () => {
                    const found = appended2.findDataWithIndex(1);
                    if (found == null) {
                        expect(found).not.toBeNil();
                        return;
                    }

                    // this can't use toBe because jest throw cannot serialize bigint errors
                    expect(found[0] === vector.data[0]).toBeTrue();
                    expect(found[1]).toBe(1);
                });

                it('should be able to find the second half of the data', () => {
                    const found = appended2.findDataWithIndex(vector.size);
                    if (found == null) {
                        expect(found).not.toBeNil();
                        return;
                    }

                    // this can't use toBe because jest throw cannot serialize bigint errors
                    expect(found[0] === newData).toBeTrue();
                    expect(found[1]).toBe(0);
                });

                it('should be able to find the third half of the data', () => {
                    const found = appended2.findDataWithIndex(appended.size);
                    if (found == null) {
                        expect(found).not.toBeNil();
                        return;
                    }

                    // this can't use toBe because jest throw cannot serialize bigint errors
                    expect(found[0] === newData2).toBeTrue();
                    expect(found[1]).toBe(0);
                });

                it('should be able return triple the output', () => {
                    expect(appended2.toJSON()).toEqual(
                        expected.concat(expected, expected)
                    );
                });

                it('should be able to slice the results to 1', () => {
                    expect(appended2.slice(0, 1).size).toBe(1);
                });

                it('should be able to slice the results to the last item', () => {
                    expect(appended2.slice(-1).size).toBe(1);
                });

                it('should be able to slice the first part', () => {
                    expect(appended2.slice(appended.size).size).toBe(vector.size);
                });

                it('should be able to slice the second part', () => {
                    expect(appended2.slice(0, appended.size).size).toBe(appended.size);
                });

                it('should be able to slice the third part', () => {
                    expect(appended2.slice(appended.size, appended2.size).size).toBe(vector.size);
                });
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
                }).toThrow();
            });
        }

        it('should be an instance of a Vector', () => {
            expect(vector).toBeInstanceOf(Vector);
        });
    });

    it('should be able to return 2 data buckets (with a an start index of 0) when slicing', () => {
        const writable1 = new WritableData(1);
        writable1.set(0, 'hi');

        const writable2 = new WritableData(1);
        writable2.set(0, 'hello');

        const vector = Vector.make([
            new ReadableData(writable1),
            new ReadableData(writable2)
        ], {
            config: {
                type: FieldType.String,
            },
            name: 'test'
        });

        expect(vector.slice().toJSON()).toEqual([
            'hi',
            'hello'
        ]);
    });

    it('should be able to return 2 data buckets (with a an start index of 1) when slicing', () => {
        const writable1 = new WritableData(1);
        writable1.set(0, 'hi');

        const writable2 = new WritableData(2);
        writable2.set(0, 'hello');
        writable2.set(1, 'howdy');

        const writable3 = new WritableData(1);
        writable3.set(0, 'hey');

        const vector = Vector.make([
            new ReadableData(writable1),
            new ReadableData(writable2),
            new ReadableData(writable3)
        ], {
            config: {
                type: FieldType.String,
            },
            name: 'test'
        });

        expect(vector.slice(1).toJSON()).toEqual([
            'hello',
            'howdy',
            'hey'
        ]);
    });

    it('should be able to find the correct data bucket index with consistent sizing of 1', () => {
        const vector = Vector.make(times(10, () => (
            new ReadableData(new WritableData(1).set(0, 'hi'))
        )), {
            config: {
                type: FieldType.String,
            },
            name: 'test'
        });

        const result = vector.findDataWithIndex(5);
        if (result != null) {
            expect(result[0]).toBe(vector.data[5]);
            expect(result[1]).toBe(0);
        } else {
            expect(result).not.toBeNil();
        }
    });

    it('should be able to find the correct data bucket index (5) with consistent sizing of 2', () => {
        const vector = Vector.make(times(10, () => (
            new ReadableData(new WritableData(2).set(0, 'hi')
                .set(1, 'hello'))
        )), {
            config: {
                type: FieldType.String,
            },
            name: 'test'
        });

        const result = vector.findDataWithIndex(5);
        if (result != null) {
            expect(result[0]).toBe(vector.data[2]);
            expect(result[1]).toBe(1);
        } else {
            expect(result).not.toBeNil();
        }
    });

    it('should be able to find the correct data bucket index (4) with consistent sizing of 2', () => {
        const vector = Vector.make(times(10, () => (
            new ReadableData(new WritableData(2).set(0, 'hi')
                .set(1, 'hello'))
        )), {
            config: {
                type: FieldType.String,
            },
            name: 'test'
        });

        const result = vector.findDataWithIndex(4);
        if (result != null) {
            expect(result[0]).toBe(vector.data[2]);
            expect(result[1]).toBe(0);
        } else {
            expect(result).not.toBeNil();
        }
    });

    it('should be able to find the correct data bucket index (10) with consistent sizing of 2', () => {
        const vector = Vector.make(times(10, () => (
            new ReadableData(new WritableData(2).set(0, 'hi')
                .set(1, 'hello'))
        )), {
            config: {
                type: FieldType.String,
            },
            name: 'test'
        });

        const result = vector.findDataWithIndex(10);
        if (result != null) {
            expect(result[0]).toBe(vector.data[5]);
            expect(result[1]).toBe(0);
        } else {
            expect(result).not.toBeNil();
        }
    });

    it('should be able to find the correct data bucket index (9) with consistent sizing of 3', () => {
        const vector = Vector.make(times(10, () => (
            new ReadableData(new WritableData(3).set(0, 'hi')
                .set(1, 'hello')
                .set(2, 'howdy'))
        )), {
            config: {
                type: FieldType.String,
            },
            name: 'test'
        });

        const result = vector.findDataWithIndex(9);
        if (result != null) {
            expect(result[0]).toBe(vector.data[3]);
            expect(result[1]).toBe(0);
        } else {
            expect(result).not.toBeNil();
        }
    });
});
