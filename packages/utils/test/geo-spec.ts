import 'jest-extended';
import {
    GeoPoint, GeoPointInput, GeoShape, GeoShapeType,
    ESGeoShapeType, JoinGeoShape, GeoInput
} from '@terascope/types';
import {
    isGeoPoint, parseGeoPoint, inGeoBoundingBox,
    inGeoBoundingBoxFP, geoContainsPoint, geoContainsPointFP,
    geoPointWithinRange, geoPointWithinRangeFP,
    toGeoJSON, geoContains, geoWithin, geoDisjoint,
    geoIntersects
} from '../src/geo';

describe('geo utils', () => {
    describe('->parseGeoPoint', () => {
        type Case = [
            msg: string,
            input: GeoPointInput,
            output: GeoPoint|null
        ];
        const testCases: Case[] = [
            [
                'parse a geo point in array',
                [30.00123, 12.233],
                { lon: 30.00123, lat: 12.233 }
            ],
            [
                'not parse a geo point an invalid array',
                [30.00123] as any,
                null
            ],
            [
                'parse a geo point in a string',
                '30.00123,-12.233',
                { lon: -12.233, lat: 30.00123 }
            ],
            [
                'not parse a geo point an invalid string',
                '30.00123',
                null
            ],
            [
                'parse a geo point in an object',
                { latitude: 30.00123, longitude: -12.233 },
                { lon: -12.233, lat: 30.00123 }
            ],
            [
                'parse a geo point in an object with abbreviated keys',
                { lat: 30.00123, lon: -12.233 },
                { lon: -12.233, lat: 30.00123 }
            ],
            [
                'not parse a geo point in an invalid object',
                { invalid: 30.00123, lon: -12.233 } as any,
                null
            ],
            [
                'parse a valid geo point shape',
                {
                    type: GeoShapeType.Point,
                    coordinates: [-15, 39.23]
                },
                { lon: -15, lat: 39.23 }
            ],
            [
                'parse an edge case geo point',
                { lat: -90, lon: 0 },
                { lon: 0, lat: -90 }
            ]
        ];

        test.each(testCases)('should %s', (_msg, input, output) => {
            expect(parseGeoPoint(input, false)).toEqual(output);
        });
    });

    describe('->isGeoPoint', () => {
        type Case = [msg: string, input: GeoPointInput, output: boolean];
        const testCases: Case[] = [
            [
                'parse a geo point in array',
                [30.00123, 12.233],
                true
            ],
            [
                'not parse a geo point an invalid array',
                [30.00123] as any,
                false
            ],
            [
                'parse a geo point in a string',
                '30.00123,-12.233',
                true
            ],
            [
                'not parse a geo point an invalid string',
                '30.00123',
                false
            ],
            [
                'parse a geo point in an object',
                { latitude: 30.00123, longitude: -12.233 },
                true
            ],
            [
                'parse a geo point in an object with abbreviated keys',
                { lat: 30.00123, lon: -12.233 },
                true
            ],
            [
                'not parse a geo point in an invalid object',
                { invalid: 30.00123, lon: -12.233 } as any,
                false
            ],
            [
                'parse a valid geo point shape',
                {
                    type: GeoShapeType.Point,
                    coordinates: [-15, 39.23]
                },
                true
            ],
            [
                'parse an edge case geo point',
                { lat: -90, lon: 0 },
                true
            ]
        ];

        test.each(testCases)('should %s', (_msg, input, output) => {
            expect(isGeoPoint(input)).toEqual(output);
        });
    });

    describe('->pointInBoundingBox', () => {
        type Case = [
            msg: string,
            topLeft: GeoPointInput,
            bottomRight: GeoPointInput,
            input: GeoPointInput,
            output: boolean
        ];
        const testCases: Case[] = [
            [
                'parse a geo point in a string',
                '33.906320,-112.758421',
                '32.813646,-111.058902',
                '33,-112',
                true
            ],
            [
                'input is outside bounding box',
                '33.906320,-112.758421',
                '32.813646,-111.058902',
                '43,-132',
                false
            ],
        ];

        test.each(testCases)('should %s', (_msg, topLeft, bottomRight, input, output) => {
            expect(inGeoBoundingBox(topLeft, bottomRight, input)).toEqual(output);
        });
    });

    describe('->inGeoBoundingBoxFP', () => {
        type Case = [
            msg: string,
            topLeft: GeoPointInput,
            bottomRight: GeoPointInput,
            input: GeoPointInput,
            output: boolean
        ];
        const testCases: Case[] = [
            [
                'parse a geo point in a string',
                '33.906320,-112.758421',
                '32.813646,-111.058902',
                '33,-112',
                true
            ],
            [
                'input is outside bounding box',
                '33.906320,-112.758421',
                '32.813646,-111.058902',
                '43,-132',
                false
            ],
        ];

        test.each(testCases)('should %s', (_msg, topLeft, bottomRight, input, output) => {
            expect(inGeoBoundingBoxFP(topLeft, bottomRight)(input)).toEqual(output);
        });
    });

    describe('->geoContainsPoint', () => {
        type Case = [
            msg: string,
            shape: GeoShape,
            input: GeoPointInput,
            output: boolean
        ];
        const testCases: Case[] = [
            [
                'point matches multi-polygon',
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
                },
                '15,15',
                true
            ],
            [
                'point matches polygon',
                {
                    type: GeoShapeType.Polygon,
                    coordinates: [
                        [[10, 10], [10, 50], [50, 50], [50, 10], [10, 10]],
                    ]
                },
                '15,15',
                true
            ],
            [
                'non-matching polygon returns false with point',
                {
                    type: GeoShapeType.Polygon,
                    coordinates: [
                        [[-10, -10], [-10, -50], [-50, -50], [-50, -10], [-10, -10]],
                        [[-20, -20], [-20, -40], [-40, -40], [-40, -20], [-20, -20]]
                    ]
                },
                '15,15',
                false
            ],
            [
                'point in polygon with holes',
                {
                    type: GeoShapeType.Polygon,
                    coordinates: [
                        [[10, 10], [10, 50], [50, 50], [50, 10], [10, 10]],
                        [[20, 20], [20, 40], [40, 40], [40, 20], [20, 20]]
                    ]
                },
                '15,15',
                true
            ],
            [
                'point in matches geo-shape point',
                {
                    type: GeoShapeType.Point,
                    coordinates: [15, 15]
                },
                '15,15',
                true
            ],
        ];

        test.each(testCases)('should %s', (_msg, shape, input, output) => {
            expect(geoContainsPoint(shape, input)).toEqual(output);
        });
    });

    describe('->geoContainsPointFP', () => {
        type Case = [
            msg: string,
            shape: GeoShape,
            input: GeoPointInput,
            output: boolean
        ];
        const testCases: Case[] = [
            [
                'point matches multi-polygon',
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
                },
                '15,15',
                true
            ],
            [
                'point matches polygon',
                {
                    type: GeoShapeType.Polygon,
                    coordinates: [
                        [[10, 10], [10, 50], [50, 50], [50, 10], [10, 10]],
                    ]
                },
                '15,15',
                true
            ],
            [
                'non-matching polygon returns false with point',
                {
                    type: GeoShapeType.Polygon,
                    coordinates: [
                        [[-10, -10], [-10, -50], [-50, -50], [-50, -10], [-10, -10]],
                        [[-20, -20], [-20, -40], [-40, -40], [-40, -20], [-20, -20]]
                    ]
                },
                '15,15',
                false
            ],
            [
                'point in polygon with holes',
                {
                    type: GeoShapeType.Polygon,
                    coordinates: [
                        [[10, 10], [10, 50], [50, 50], [50, 10], [10, 10]],
                        [[20, 20], [20, 40], [40, 40], [40, 20], [20, 20]]
                    ]
                },
                '15,15',
                true
            ],
            [
                'point in matches geo-shape point',
                {
                    type: GeoShapeType.Point,
                    coordinates: [15, 15]
                },
                '15,15',
                true
            ],
        ];

        test.each(testCases)('should %s', (_msg, shape, input, output) => {
            expect(geoContainsPointFP(input)(shape)).toEqual(output);
        });
    });

    describe('->geoPointWithinRange', () => {
        type Case = [
            msg: string,
            point: GeoPointInput,
            distance: string,
            input: GeoPointInput,
            output: boolean
        ];
        const testCases: Case[] = [
            [
                'parse a geo point in a string',
                '33.435518,-111.873616',
                '5000m',
                '33.435967,-111.867710',
                true
            ],
            [
                'parse a geo point in a string',
                '33.435518,-111.873616',
                '5000m',
                '22.435967,-150.867710',
                false
            ],
        ];

        test.each(testCases)('should %s', (_msg, topLeft, bottomRight, input, output) => {
            expect(geoPointWithinRange(topLeft, bottomRight, input)).toEqual(output);
        });
    });

    describe('->geoPointWithinRangeFP', () => {
        type Case = [
            msg: string,
            point: GeoPointInput,
            distance: string,
            input: GeoPointInput,
            output: boolean
        ];
        const testCases: Case[] = [
            [
                'parse a geo point in a string',
                '33.435518,-111.873616',
                '5000m',
                '33.435967,-111.867710',
                true
            ],
            [
                'parse a geo point in a string',
                '33.435518,-111.873616',
                '5000m',
                '22.435967,-150.867710',
                false
            ],
        ];

        test.each(testCases)('should %s', (_msg, topLeft, bottomRight, input, output) => {
            expect(geoPointWithinRangeFP(topLeft, bottomRight)(input)).toEqual(output);
        });
    });

    describe('->toGeoJSON', () => {
        type Case = [
            msg: string,
            input: GeoPointInput | JoinGeoShape |GeoPointInput[],
            output: GeoShape
        ];
        const testCases: Case[] = [
            [
                'parse a geo point to a geoJSON point',
                '33.435518,-111.873616',
                {
                    type: GeoShapeType.Point,
                    coordinates: [-111.873616, 33.435518]
                }
            ],
            [
                'parse a list geo point to a geoJSON polygon',
                ['10,10', '10,50', '50,50', '50,10', '10,10'],
                {
                    type: GeoShapeType.Polygon,
                    coordinates: [[[10, 10], [50, 10], [50, 50], [10, 50], [10, 10]]]
                }
            ],
            [
                'converts an Elasticsearch multi-polygon to a geoJSON multi-polygon',
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
                },
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
                }
            ],
        ];

        test.each(testCases)('should %s', (_msg, input, output) => {
            expect(toGeoJSON(input)).toEqual(output);
        });
    });

    describe('->geoWithin', () => {
        type Case = [
            msg: string,
            firstGeo: GeoInput,
            secondGeo: GeoInput,
            output: boolean
        ];
        const testCases: Case[] = [
            [
                'compare polygon to polygon that is within',
                {
                    type: GeoShapeType.Polygon,
                    coordinates: [[[10, 10], [50, 10], [50, 50], [10, 50], [10, 10]]]
                },
                {
                    type: GeoShapeType.Polygon,
                    coordinates: [[[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]]]
                },
                true
            ],
            [
                'compare polygon to polygon that is not within',
                {
                    type: GeoShapeType.Polygon,
                    coordinates: [[[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]]]
                },
                {
                    type: GeoShapeType.Polygon,
                    coordinates: [[[10, 10], [50, 10], [50, 50], [10, 50], [10, 10]]]
                },
                false
            ],
            [
                'compare point to polygon',
                {
                    type: GeoShapeType.Point,
                    coordinates: [20, 20]
                },
                {
                    type: GeoShapeType.Polygon,
                    coordinates: [[[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]]]
                },
                true
            ],
            [
                'compare geo-point input type to polygon',
                '20, 20',
                {
                    type: GeoShapeType.Polygon,
                    coordinates: [[[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]]]
                },
                true
            ],
        ];

        test.each(testCases)('should %s', (_msg, firstGeo, secondGeo, output) => {
            expect(geoWithin(firstGeo, secondGeo)).toEqual(output);
        });
    });

    describe('->geoContains', () => {
        type Case = [
            msg: string,
            firstGeo: GeoInput,
            secondGeo: GeoInput,
            output: boolean
        ];
        const testCases: Case[] = [
            [
                'compare polygon to polygon that is not contained',
                {
                    type: GeoShapeType.Polygon,
                    coordinates: [[[10, 10], [50, 10], [50, 50], [10, 50], [10, 10]]]
                },
                {
                    type: GeoShapeType.Polygon,
                    coordinates: [[[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]]]
                },
                false
            ],
            [
                'compare polygon to polygon that is contained',
                {
                    type: GeoShapeType.Polygon,
                    coordinates: [[[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]]]
                },
                {
                    type: GeoShapeType.Polygon,
                    coordinates: [[[10, 10], [50, 10], [50, 50], [10, 50], [10, 10]]]
                },
                true
            ],
            [
                'compare multi-polygon to polygon',
                {
                    type: GeoShapeType.MultiPolygon,
                    coordinates: [
                        [
                            [[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]]
                        ],
                        [
                            [[-10, -10], [-10, -50], [-50, -50], [-50, -10], [-10, -10]],
                        ]
                    ]
                },
                {
                    type: GeoShapeType.Polygon,
                    coordinates: [[[10, 10], [50, 10], [50, 50], [10, 50], [10, 10]]]
                },
                true
            ],
            [
                'compare polygon to point',
                {
                    type: GeoShapeType.Polygon,
                    coordinates: [[[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]]]
                },
                {
                    type: GeoShapeType.Point,
                    coordinates: [20, 20]
                },
                true
            ],
            [
                'compare polygon to point',
                {
                    type: GeoShapeType.Polygon,
                    coordinates: [[[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]]]
                },
                '20, 20',
                true
            ],
            [
                'compare polygon to point',
                {
                    type: GeoShapeType.MultiPolygon,
                    coordinates: [
                        [
                            [[10, 10], [10, 50], [50, 50], [50, 10], [10, 10]],
                            [[20, 20], [20, 40], [40, 40], [40, 20], [20, 20]]
                        ],
                        [
                            [[-10, -10], [-10, -50], [-50, -50], [-50, -10], [-10, -10]],
                            [[-20, -20], [-20, -40], [-40, -40], [-40, -20], [-20, -20]]
                        ]
                    ]
                },
                '15, 20',
                true
            ],
        ];

        test.each(testCases)('should %s', (_msg, firstGeo, secondGeo, output) => {
            expect(geoContains(firstGeo, secondGeo)).toEqual(output);
        });
    });

    describe('->geoIntersects', () => {
        type Case = [
            msg: string,
            firstGeo: GeoInput,
            secondGeo: GeoInput,
            output: boolean
        ];
        const testCases: Case[] = [
            [
                'compare polygon to polygon that is not intersect',
                {
                    type: GeoShapeType.Polygon,
                    coordinates: [[[10, 10], [50, 10], [50, 50], [10, 50], [10, 10]]]
                },
                {
                    type: GeoShapeType.Polygon,
                    coordinates: [[[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]]]
                },
                false
            ],
            [
                'compare polygon to polygon that intersects',
                {
                    type: GeoShapeType.Polygon,
                    coordinates: [[[10, 10], [50, 10], [50, 50], [10, 50], [10, 10]]]
                },
                {
                    type: GeoShapeType.Polygon,
                    coordinates: [[[0, 0], [0, 15], [15, 15], [15, 0], [0, 0]]]
                },
                true
            ],
            [
                'compare polygon to multiPolygon that intersects',
                {
                    type: GeoShapeType.Polygon,
                    coordinates: [[[10, 10], [50, 10], [50, 50], [10, 50], [10, 10]]]
                },
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
                },
                true
            ],
            [
                'compare polygon to point',
                {
                    type: GeoShapeType.Polygon,
                    coordinates: [[[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]]]
                },
                {
                    type: GeoShapeType.Point,
                    coordinates: [20, 20]
                },
                true
            ],
            [
                'compare polygon to point',
                {
                    type: GeoShapeType.Polygon,
                    coordinates: [[[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]]]
                },
                '20, 20',
                true
            ],
        ];

        test.each(testCases)('should %s', (_msg, firstGeo, secondGeo, output) => {
            expect(geoIntersects(firstGeo, secondGeo)).toEqual(output);
        });
    });

    describe('->geoDisjoint', () => {
        type Case = [
            msg: string,
            firstGeo: GeoInput,
            secondGeo: GeoInput,
            output: boolean
        ];
        const testCases: Case[] = [
            [
                'compare polygon to polygon that is not disjointed',
                {
                    type: GeoShapeType.Polygon,
                    coordinates: [[[10, 10], [50, 10], [50, 50], [10, 50], [10, 10]]]
                },
                {
                    type: GeoShapeType.Polygon,
                    coordinates: [[[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]]]
                },
                false
            ],
            [
                'compare polygon to polygon that is disjointed',
                {
                    type: GeoShapeType.Polygon,
                    coordinates: [[[-10, -10], [-10, -50], [-50, -50], [-50, -10], [-10, -10]]]
                },
                {
                    type: GeoShapeType.Polygon,
                    coordinates: [[[10, 10], [50, 10], [50, 50], [10, 50], [10, 10]]]
                },
                true
            ],
            [
                'compare polygon to point',
                {
                    type: GeoShapeType.Polygon,
                    coordinates: [[[-10, -10], [-10, -50], [-50, -50], [-50, -10], [-10, -10]]]
                },
                {
                    type: GeoShapeType.Point,
                    coordinates: [20, 20]
                },
                true
            ],
            [
                'compare multipolygon with holes to point in the hole',
                {
                    type: GeoShapeType.MultiPolygon,
                    coordinates: [
                        [
                            [[10, 10], [10, 50], [50, 50], [50, 10], [10, 10]],
                            [[20, 20], [20, 40], [40, 40], [40, 20], [20, 20]]
                        ],
                        [
                            [[-10, -10], [-10, -50], [-50, -50], [-50, -10], [-10, -10]],
                            [[-20, -20], [-20, -40], [-40, -40], [-40, -20], [-20, -20]]
                        ]
                    ]
                },
                {
                    type: GeoShapeType.Point,
                    coordinates: [30, 30]
                },
                true
            ],
        ];

        test.each(testCases)('should %s', (_msg, firstGeo, secondGeo, output) => {
            expect(geoDisjoint(firstGeo, secondGeo)).toEqual(output);
        });
    });
});
