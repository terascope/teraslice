import 'jest-extended';
import { GeoShapeType, GeoInput } from '@terascope/types';
import { geoDisjointFP, geoDisjoint } from '../src/index.js';

type GeoDisjointCase = [
    msg: string,
    firstGeo: GeoInput,
    secondGeo: GeoInput,
    output: boolean
];

const geoDisjointTestCases: GeoDisjointCase[] = [
    [
        'point is separate from point',
        {
            type: GeoShapeType.Point,
            coordinates: [30, 40]
        },
        {
            type: GeoShapeType.Point,
            coordinates: [20, 20]
        },
        true
    ],
    [
        'point is separate from point (false)',
        {
            type: GeoShapeType.Point,
            coordinates: [30, 40]
        },
        {
            type: GeoShapeType.Point,
            coordinates: [30, 40]
        },
        false
    ],
    [
        'point is separate from polygon',
        {
            type: GeoShapeType.Point,
            coordinates: [-30, -40]
        },
        {
            type: GeoShapeType.Polygon,
            coordinates: [[[10, 10], [50, 10], [50, 50], [10, 50], [10, 10]]]
        },
        true
    ],
    [
        'point is separate from polygon (false)',
        {
            type: GeoShapeType.Point,
            coordinates: [30, 40]
        },
        {
            type: GeoShapeType.Polygon,
            coordinates: [[[10, 10], [50, 10], [50, 50], [10, 50], [10, 10]]]
        },
        false
    ],
    [
        'point is separate from polygon with holes',
        {
            type: GeoShapeType.Point,
            coordinates: [-30, -40]
        },
        {
            type: GeoShapeType.Polygon,
            coordinates: [
                [[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]],
                [[10, 10], [90, 10], [90, 50], [10, 50], [10, 10]]
            ]
        },
        true
    ],
    [
        'point is separate from polygon with holes (false)',
        {
            type: GeoShapeType.Point,
            coordinates: [5, 5]
        },
        {
            type: GeoShapeType.Polygon,
            coordinates: [
                [[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]],
                [[10, 10], [90, 10], [90, 50], [10, 50], [10, 10]]
            ]
        },
        false
    ],
    [
        'point is separate from polygon with holes (true)',
        {
            type: GeoShapeType.Point,
            coordinates: [30, 30]
        },
        {
            type: GeoShapeType.Polygon,
            coordinates: [
                [[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]],
                [[10, 10], [90, 10], [90, 50], [10, 50], [10, 10]]
            ]
        },
        true
    ],
    [
        'point is separate from multipolygon',
        {
            type: GeoShapeType.Point,
            coordinates: [-30, -30]
        },
        {
            type: GeoShapeType.MultiPolygon,
            coordinates: [
                [
                    [[10, 10], [10, 20], [20, 20], [20, 10], [10, 10]],
                ],
                [
                    [[30, 30], [30, 40], [40, 40], [40, 30], [30, 30]],
                ]
            ]
        },
        true
    ],
    [
        'point is separate from multipolygon (false)',
        {
            type: GeoShapeType.Point,
            coordinates: [35, 35]
        },
        {
            type: GeoShapeType.MultiPolygon,
            coordinates: [
                [
                    [[10, 10], [10, 20], [20, 20], [20, 10], [10, 10]],
                ],
                [
                    [[30, 30], [30, 40], [40, 40], [40, 30], [30, 30]],
                ]
            ]
        },
        false
    ],
    [
        'point is separate from multipolygon with holes (true)',
        {
            type: GeoShapeType.Point,
            coordinates: [35, 35]
        },
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
        true
    ],
    [
        'point is separate from multipolygon with holes (false)',
        {
            type: GeoShapeType.Point,
            coordinates: [-15, -15]
        },
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
        false
    ],
    [
        'polygon is separate from polygon (false)',
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
        'polygon is separate from polygon (true)',
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
        'polygon with holes is separate from polygon (true)',
        {
            type: GeoShapeType.Polygon,
            coordinates: [[[20, 20], [40, 20], [40, 40], [20, 40], [20, 20]]]
        },
        {
            type: GeoShapeType.Polygon,
            coordinates: [
                [[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]],
                [[10, 10], [90, 10], [90, 50], [10, 50], [10, 10]]
            ]
        },
        true
    ],
    [
        'polygon with holes is separate from polygon (false)',
        {
            type: GeoShapeType.Polygon,
            coordinates: [[[5, 5], [5, 8], [8, 8], [8, 5], [5, 5]]]
        },
        {
            type: GeoShapeType.Polygon,
            coordinates: [
                [[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]],
                [[10, 10], [90, 10], [90, 50], [10, 50], [10, 10]]
            ]
        },
        false
    ],
    [
        'multi-polygon is separate from  multi-polygon (false)',
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
            type: GeoShapeType.MultiPolygon,
            coordinates: [
                [
                    [[10, 10], [10, 20], [20, 20], [20, 10], [10, 10]],
                ],
                [
                    [[30, 30], [30, 40], [40, 40], [40, 30], [30, 30]],
                ]
            ]
        },
        false
    ],
    [
        'multi-polygon is separate from multi-polygon (true)',
        {
            type: GeoShapeType.MultiPolygon,
            coordinates: [
                [
                    [[20, 20], [20, 40], [40, 40], [40, 20], [20, 20]],
                ],
                [
                    [[-20, -20], [-20, -40], [-40, -40], [-40, -20], [-20, -20]],
                ]
            ]
        },
        {
            type: GeoShapeType.MultiPolygon,
            coordinates: [
                [
                    [[10, 10], [10, 15], [15, 15], [15, 10], [10, 10]],
                ],
                [
                    [[-60, -60], [-60, -70], [-70, -70], [-70, -60], [-60, -60]],
                ]
            ]
        },
        true
    ],
    [
        'multipolygon with holes is separate from multi-polygon',
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
            type: GeoShapeType.MultiPolygon,
            coordinates: [
                [
                    [[30, 30], [30, 35], [35, 35], [35, 30], [30, 30]],
                ],
                [
                    [[-60, -60], [-60, -70], [-70, -70], [-70, -60], [-60, -60]],
                ]
            ]
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
