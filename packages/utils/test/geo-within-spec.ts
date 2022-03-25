import 'jest-extended';
import { GeoShapeType, GeoInput } from '@terascope/types';
import { geoWithinFP, geoWithin } from '../src/geo';

type WithinCase = [
    msg: string,
    firstGeo: GeoInput,
    secondGeo: GeoInput,
    output: boolean
];

const withinTestCases: WithinCase[] = [
    [
        'compare point to point',
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
    [
        'compare point to polygon with holes',
        {
            type: GeoShapeType.Point,
            coordinates: [20, 20]
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
        'compare point to multipolygon',
        {
            type: GeoShapeType.Point,
            coordinates: [-30, -30]
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
        'compare point to multipolygon with holes',
        {
            type: GeoShapeType.Point,
            coordinates: [-30, -30]
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
        'compare polygon to point (poly cannot be within a point)',
        {
            type: GeoShapeType.Polygon,
            coordinates: [[[10, 10], [50, 10], [50, 50], [10, 50], [10, 10]]]
        },
        {
            type: GeoShapeType.Point,
            coordinates: [30, 30]
        },
        false
    ],
    [
        'compare point to line',
        {
            type: GeoShapeType.Point,
            coordinates: [11, 11]
        },
        {
            type: GeoShapeType.LineString,
            coordinates: [[10, 10], [15, 15], [20, 20]]
        },
        true
    ],
    [
        'compare point to line (false)',
        {
            type: GeoShapeType.Point,
            coordinates: [14, 11]
        },
        {
            type: GeoShapeType.LineString,
            coordinates: [[10, 10], [15, 15], [20, 20]]
        },
        false
    ],
    [
        'compare point to multi-line',
        {
            type: GeoShapeType.Point,
            coordinates: [11, 11]
        },
        {
            type: GeoShapeType.MultiLineString,
            coordinates: [
                [[10, 10], [15, 15], [20, 20]],
                [[12, 12], [17, 17], [22, 22]],
            ]
        },
        true
    ],
    [
        'compare point to multi-line (false)',
        {
            type: GeoShapeType.Point,
            coordinates: [3, 11]
        },
        {
            type: GeoShapeType.MultiLineString,
            coordinates: [
                [[10, 10], [15, 15], [20, 20]],
                [[12, 12], [17, 17], [22, 22]],
            ]
        },
        false
    ],
    [
        'compare line to point (false)',
        {
            type: GeoShapeType.LineString,
            coordinates: [[10, 10], [15, 15], [20, 20]]
        },
        {
            type: GeoShapeType.Point,
            coordinates: [11, 11]
        },
        false
    ],
    [
        'compare multi-line to point (false)',
        {
            type: GeoShapeType.MultiLineString,
            coordinates: [
                [[10, 10], [15, 15], [20, 20]],
                [[12, 12], [17, 17], [22, 22]],
            ]
        },
        {
            type: GeoShapeType.Point,
            coordinates: [11, 11]
        },
        false
    ],
    [
        'compare line to polygon',
        {
            type: GeoShapeType.LineString,
            coordinates: [[20, 20], [40, 20], [22, 45]]
        },
        {
            type: GeoShapeType.Polygon,
            coordinates: [[[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]]]
        },
        true
    ],
    [
        'compare line to polygon with holes',
        {
            type: GeoShapeType.LineString,
            coordinates: [[5, 1], [4, 8], [3, 2]]
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
        'compare line to polygon with holes (false)',
        {
            type: GeoShapeType.LineString,
            coordinates: [[20, 20], [40, 20], [22, 45]]
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
        'compare polygon to line (false)',
        {
            type: GeoShapeType.Polygon,
            coordinates: [[[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]]]
        },
        {
            type: GeoShapeType.LineString,
            coordinates: [[20, 20], [40, 20], [22, 45]]
        },
        false
    ],
    [
        'compare multi-line to polygon',
        {
            type: GeoShapeType.MultiLineString,
            coordinates: [
                [[5, 1], [4, 8], [3, 2]],
                [[95, 1], [94, 8], [93, 2]],
            ]
        },
        {
            type: GeoShapeType.Polygon,
            coordinates: [[[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]]]
        },
        true
    ],
    [
        'compare multi-line to polygon with holes',
        {
            type: GeoShapeType.MultiLineString,
            coordinates: [
                [[5, 1], [4, 8], [3, 2]],
                [[95, 1], [94, 8], [93, 2]],
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
        'compare multi-line to polygon with holes (false)',
        {
            type: GeoShapeType.MultiLineString,
            coordinates: [
                [[20, 20], [40, 20], [22, 45]],
                [[21, 20], [42, 20], [22, 45]],
            ]
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
        'compare polygon to multi-line (false)',
        {
            type: GeoShapeType.Polygon,
            coordinates: [[[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]]]
        },
        {
            type: GeoShapeType.MultiLineString,
            coordinates: [
                [[20, 20], [40, 20], [22, 45]],
                [[21, 20], [42, 20], [22, 45]],
            ]
        },
        false
    ],
    [
        'compare line to multi-polygon',
        {
            type: GeoShapeType.LineString,
            coordinates: [[15, 15], [20, 20], [22, 32]]
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
        'compare line to multi-polygon (false)',
        {
            type: GeoShapeType.LineString,
            coordinates: [[1, 15], [2, 20], [2, 32]]
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
        false
    ],
    [
        'compare multi-polygon to line (false)',
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
            type: GeoShapeType.LineString,
            coordinates: [[15, 15], [20, 20], [22, 32]]
        },
        false
    ],
    [
        'compare multi-line to multi-polygon',
        {
            type: GeoShapeType.MultiLineString,
            coordinates: [
                [[20, 20], [40, 20], [22, 45]],
                [[-21, -20], [-42, -20], [-22, -45]],
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
        },
        true
    ],
    [
        'compare line to multi-polygon (false)',
        {
            type: GeoShapeType.MultiLineString,
            coordinates: [
                [[20, 20], [40, 20], [22, 45]],
                [[-1, -20], [-2, -20], [-22, -4]],
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
        },
        false
    ],
    [
        'compare multi-polygon to line (false)',
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
            type: GeoShapeType.MultiLineString,
            coordinates: [
                [[20, 20], [40, 20], [22, 45]],
                [[-21, -20], [-42, -20], [-22, -45]],
            ]
        },
        false
    ],
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
        'compare polygon against itself',
        {
            type: GeoShapeType.Polygon,
            coordinates: [[[10, 10], [50, 10], [50, 50], [10, 50], [10, 10]]]
        },
        {
            type: GeoShapeType.Polygon,
            coordinates: [[[10, 10], [50, 10], [50, 50], [10, 50], [10, 10]]]
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
        'compare polygon to polygon with holes',
        {
            type: GeoShapeType.Polygon,
            coordinates: [[[20, 20], [50, 20], [50, 50], [20, 50], [20, 20]]]
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
        'compare polygon with holes against itself',
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
        'compare polygon to multi-polygon',
        {
            type: GeoShapeType.Polygon,
            coordinates: [[[20, 20], [50, 20], [50, 50], [20, 50], [20, 20]]]
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
        'compare polygon to multipolygon with holes',
        {
            type: GeoShapeType.Polygon,
            coordinates: [[[20, 20], [50, 20], [50, 50], [20, 50], [20, 20]]]
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
        'compare multipolygon to point (always false, but not throw)',
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
        {
            type: GeoShapeType.Point,
            coordinates: [-80, -80]
        },
        false
    ],
    [
        'compare multipolygon to polygon',
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
        {
            type: GeoShapeType.Polygon,
            coordinates: [[[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]]]
        },
        true
    ],
    [
        'compare multipolygon to polygon with holes',
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
        'compare multipolygon to multipolygon (all in one poly)',
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
        'compare multipolygon to multipolygon (in separate polys)',
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
        'compare multipolygon against itself',
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
        'compare multipolygon to multipolygon (not matching)',
        {
            type: GeoShapeType.MultiPolygon,
            coordinates: [
                [
                    [[10, 10], [10, 20], [20, 20], [20, 10], [10, 10]],
                ],
                [
                    [[-60, -60], [-60, -70], [-70, -70], [-70, -60], [-60, -60]],
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
        },
        false
    ],
    [
        'compare multipolygon to multipolygon with holes',
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
