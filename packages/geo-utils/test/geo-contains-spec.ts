import 'jest-extended';
import { GeoShapeType, GeoInput } from '@terascope/types';
import { geoContains, geoContainsFP } from '../src/index.js';

type GeoContainsCase = [
    msg: string,
    firstGeo: GeoInput,
    secondGeo: GeoInput,
    output: boolean
];

const geoContainsTestCases: GeoContainsCase[] = [
    [
        'point contains point if they are the same',
        {
            type: GeoShapeType.Point,
            coordinates: [20, 20]
        },
        {
            type: GeoShapeType.Point,
            coordinates: [20, 20]
        },
        true
    ],
    [
        'point contains point return false if not the same',
        {
            type: GeoShapeType.Point,
            coordinates: [20, 20]
        },
        {
            type: GeoShapeType.Point,
            coordinates: [20, 30]
        },
        false
    ],
    [
        'point contains polygon (will not throw) return false as its impossible',
        {
            type: GeoShapeType.Point,
            coordinates: [20, 20]
        },
        {
            type: GeoShapeType.Polygon,
            coordinates: [[[10, 10], [50, 10], [50, 50], [10, 50], [10, 10]]]
        },
        false
    ],
    [
        'point contains multi-polygon (will not throw) return false as its impossible',
        {
            type: GeoShapeType.Point,
            coordinates: [20, 20]
        },
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
        false
    ],
    [
        'polygon contains point',
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
        'polygon with holes contains point (false)',
        {
            type: GeoShapeType.Polygon,
            coordinates: [
                [[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]],
                [[10, 10], [90, 10], [90, 50], [10, 50], [10, 10]]
            ]
        },
        {
            type: GeoShapeType.Point,
            coordinates: [20, 20]
        },
        false
    ],
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
        'compare polygon to itself',
        {
            type: GeoShapeType.Polygon,
            coordinates: [[[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]]]
        },
        {
            type: GeoShapeType.Polygon,
            coordinates: [[[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]]]
        },
        true
    ],
    [
        'compare polygon with holes to polygon that is not contained',
        {
            type: GeoShapeType.Polygon,
            coordinates: [
                [[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]],
                [[10, 10], [90, 10], [90, 50], [10, 50], [10, 10]]
            ]
        },
        {
            type: GeoShapeType.Polygon,
            coordinates: [[[10, 10], [50, 10], [50, 50], [10, 50], [10, 10]]]
        },
        false
    ],
    [
        'compare polygon with holes to itself',
        {
            type: GeoShapeType.Polygon,
            coordinates: [
                [[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]],
                [[10, 10], [90, 10], [90, 50], [10, 50], [10, 10]]
            ]
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
        'polygon contains multipolygon',
        {
            type: GeoShapeType.Polygon,
            coordinates: [[[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]]]
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
        'polygon contains multipolygon (false)',
        {
            type: GeoShapeType.Polygon,
            coordinates: [[[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]]]
        },
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
        false
    ],
    [
        'polygon with holes contains multipolygon',
        {
            type: GeoShapeType.Polygon,
            coordinates: [
                [[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]],
                [[10, 10], [90, 10], [90, 50], [10, 50], [10, 10]]
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
        'multi-polygon contains point',
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
        '-15, -20',
        true
    ],
    [
        'multi-polygon contains polygon',
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
        'multi-polygon does not contains polygon',
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
            coordinates: [[[10, 10], [70, 10], [70, 70], [10, 70], [10, 10]]]
        },
        false
    ],
    [
        'multi-polygon contains multi-polygon',
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
        true
    ],
    [
        'multi-polygon contains itself',
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
                    [[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]]
                ],
                [
                    [[-10, -10], [-10, -50], [-50, -50], [-50, -10], [-10, -10]],
                ]
            ]
        },
        true
    ],
    [
        'multipolygon contains multipolygon (in separate polys)',
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
        true
    ],

    [
        'multipolygon with holes contains point',
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
        '15, 15',
        true
    ],
    [
        'multipolygon with holes contains point (false)',
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
        '-30, -30',
        false
    ],
    [
        'multipolygon with holes contains polygon (false)',
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
            type: GeoShapeType.Polygon,
            coordinates: [[[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]]]
        },
        false
    ],
    [
        'multipolygon with holes contains polygon (true)',
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
            type: GeoShapeType.Polygon,
            coordinates: [[[15, 15], [18, 15], [18, 18], [15, 18], [15, 15]]]
        },
        true
    ],
    [
        'multipolygon with holes contains multipolygon (true)',
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
                    [[15, 15], [18, 15], [18, 18], [15, 18], [15, 15]],
                ],
                [
                    [[-15, -15], [-18, -15], [-18, -18], [-15, -18], [-15, -15]]
                ]
            ]
        },
        true
    ],
    [
        'multipolygon with holes contains multipolygon (false)',
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
                    [[15, 15], [18, 15], [18, 18], [15, 18], [15, 15]],
                ],
                [
                    [[-25, -25], [-18, -25], [-18, -18], [-25, -18], [-25, -25]]
                ]
            ]
        },
        false
    ],
    [
        'multipolygon with holes contains itself (true)',
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
