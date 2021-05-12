import 'jest-extended';
import {
    GeoPoint, GeoPointInput, GeoShape, GeoShapeType,
    ESGeoShapeType, JoinGeoShape, GeoInput
} from '@terascope/types';
import {
    isGeoPoint, parseGeoPoint, inGeoBoundingBox,
    inGeoBoundingBoxFP, geoPointWithinRange, geoPointWithinRangeFP,
    toGeoJSON, geoContains, geoWithin, geoDisjoint,
    geoIntersects, geoWithinFP, geoContainsFP, geoIntersectsFP,
    geoDisjointFP
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

    type BoundingBoxCase = [
        msg: string,
        topLeft: GeoPointInput,
        bottomRight: GeoPointInput,
        input: GeoPointInput,
        output: boolean
    ];
    const bbTestCases: BoundingBoxCase[] = [
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

    describe('->pointInBoundingBox', () => {
        test.each(bbTestCases)('should %s', (_msg, topLeft, bottomRight, input, output) => {
            expect(inGeoBoundingBox(topLeft, bottomRight, input)).toEqual(output);
        });
    });

    describe('->inGeoBoundingBoxFP', () => {
        test.each(bbTestCases)('should %s', (_msg, topLeft, bottomRight, input, output) => {
            expect(inGeoBoundingBoxFP(topLeft, bottomRight)(input)).toEqual(output);
        });
    });

    type PointWithinCase = [
        msg: string,
        point: GeoPointInput,
        distance: string,
        input: GeoPointInput,
        output: boolean
    ];

    const pointWithinTestCases: PointWithinCase[] = [
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

    describe('->geoPointWithinRange', () => {
        test.each(pointWithinTestCases)('should %s', (_msg, topLeft, bottomRight, input, output) => {
            expect(geoPointWithinRange(topLeft, bottomRight, input)).toEqual(output);
        });
    });

    describe('->geoPointWithinRangeFP', () => {
        test.each(pointWithinTestCases)('should %s', (_msg, topLeft, bottomRight, input, output) => {
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

    type WithinCase = [
        msg: string,
        firstGeo: GeoInput,
        secondGeo: GeoInput,
        output: boolean
    ];

    const withinTestCases: WithinCase[] = [
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

    describe('->geoWithin', () => {
        test.each(withinTestCases)('should %s', (_msg, firstGeo, secondGeo, output) => {
            expect(geoWithin(firstGeo, secondGeo)).toEqual(output);
        });
    });

    describe('->geoWithinFP', () => {
        test.each(withinTestCases)('should %s', ((_msg, firstGeo, secondGeo, output) => {
            expect(geoWithinFP(secondGeo)(firstGeo)).toEqual(output);
        }));
    });

    type GeoContainsCase = [
        msg: string,
        firstGeo: GeoInput,
        secondGeo: GeoInput,
        output: boolean
    ];
    const geoContainsTestCases: GeoContainsCase[] = [
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
            'compare polygon contains point',
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
            'compare polygon contains point geo input',
            {
                type: GeoShapeType.Polygon,
                coordinates: [[[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]]]
            },
            '20, 20',
            true
        ],
        [
            'compare multi-polygon contains point',
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

    describe('->geoContains', () => {
        test.each(geoContainsTestCases)('should %s', (_msg, firstGeo, secondGeo, output) => {
            expect(geoContains(firstGeo, secondGeo)).toEqual(output);
        });
    });

    describe('->geoContainsFP', () => {
        test.each(geoContainsTestCases)('should %s', (_msg, firstGeo, secondGeo, output) => {
            expect(geoContainsFP(secondGeo)(firstGeo)).toEqual(output);
        });
    });

    type GeoIntersectsCase = [
        msg: string,
        firstGeo: GeoInput,
        secondGeo: GeoInput,
        output: boolean
    ];
    const geoIntersectsCase: GeoIntersectsCase[] = [
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
            true
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

    describe('->geoIntersects', () => {
        test.each(geoIntersectsCase)('should %s', (_msg, firstGeo, secondGeo, output) => {
            expect(geoIntersects(firstGeo, secondGeo)).toEqual(output);
        });
    });

    describe('->geoIntersectsFP', () => {
        test.each(geoIntersectsCase)('should %s', (_msg, firstGeo, secondGeo, output) => {
            expect(geoIntersectsFP(secondGeo)(firstGeo)).toEqual(output);
        });
    });

    type GeoDisjointCase = [
        msg: string,
        firstGeo: GeoInput,
        secondGeo: GeoInput,
        output: boolean
    ];
    const geoDisjointTestCases: GeoDisjointCase[] = [
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

    describe('->geoDisjoint', () => {
        test.each(geoDisjointTestCases)('should %s', (_msg, firstGeo, secondGeo, output) => {
            expect(geoDisjoint(firstGeo, secondGeo)).toEqual(output);
        });
    });

    describe('->geoDisjointFP', () => {
        test.each(geoDisjointTestCases)('should %s', (_msg, firstGeo, secondGeo, output) => {
            expect(geoDisjointFP(secondGeo)(firstGeo)).toEqual(output);
        });
    });
});
