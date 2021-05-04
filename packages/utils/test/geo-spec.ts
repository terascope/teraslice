import 'jest-extended';
import {
    GeoPoint, GeoPointInput, GeoShape, GeoShapeType
} from '@terascope/types';
import {
    isGeoPoint, parseGeoPoint, inGeoBoundingBox,
    inGeoBoundingBoxFP, geoContainsPoint, geoContainsPointFP,
    geoPointWithinRange, geoPointWithinRangeFP
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
});
