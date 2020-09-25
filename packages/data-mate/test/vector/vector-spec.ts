import 'jest-fixtures';
import { toString } from '@terascope/utils';
import {
    DateFormat,
    ESGeoShapeMultiPolygon,
    ESGeoShapePoint,
    ESGeoShapePolygon,
    ESGeoShapeType,
    FieldType, GeoShapeMultiPolygon, GeoShapePoint, GeoShapePolygon, GeoShapeType
} from '@terascope/types';
import { bigIntToJSON, Builder, Vector } from '../../src';

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
            [nowDate, nowDate.toISOString(), now, null, undefined],
            [
                nowDate.toISOString(),
                nowDate.toISOString(),
                nowDate.toISOString(),
                null,
                null
            ]
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
            [
                { lat: 60, lon: 90 },
                { lat: 60.456, lon: 90.123 },
                { lat: 89.002, lon: 20.034990 },
                null,
                null
            ]
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
            [
                { foo: 'bar', other: { 1: 2 }, arr: [1, 2, 3] },
                { field1: null, field2: undefined },
                {},
                null,
                null
            ],
        ],
    ];

    describe.each(testCases)('when field type is %s', (type, input, output) => {
        let vector: Vector<any>;
        let expected: any[];
        beforeAll(() => {
            const builder = Builder.make({ type, array: false });
            input.forEach((val) => builder.append(val));
            vector = builder.toVector();
            expected = (output ?? input).map((val) => {
                if (typeof val === 'bigint') {
                    return bigIntToJSON(val);
                }
                if (val === undefined && !output) return null;
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
            expect(vector.distinct()).toBe(new Set(expected.map(toString)).size);
        });

        it('should have the correct field config', () => {
            if (type === FieldType.Date) {
                expect(vector.config).toEqual({
                    type,
                    format: DateFormat.iso_8601,
                    array: false
                });
            } else {
                expect(vector.config).toEqual({
                    type,
                    array: false
                });
            }
        });

        it('should be an instance of a Vector', () => {
            expect(vector).toBeInstanceOf(Vector);
        });

        test.todo('should be immutable');
    });

    test.todo('->reduce');
    test.todo('->filter');
});
