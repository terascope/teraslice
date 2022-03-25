import 'jest-extended';
import { GeoShapeType, GeoInput } from '@terascope/types';
import { geoContains, geoContainsFP } from '../src/geo';

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
        'line contains point',
        {
            type: GeoShapeType.LineString,
            coordinates: [
                [11, 11], [11, 12], [11, 13]
            ]
        },
        {
            type: GeoShapeType.Point,
            coordinates: [11, 12]
        },
        true
    ],
    [
        'line contains point (false)',
        {
            type: GeoShapeType.LineString,
            coordinates: [
                [11, 11], [11, 12], [11, 13]
            ]
        },
        {
            type: GeoShapeType.Point,
            coordinates: [11, 14]
        },
        false
    ],
    [
        'multi-line contains point',
        {
            type: GeoShapeType.MultiLineString,
            coordinates: [
                [[11, 11], [11, 12], [11, 13]],
                [[15, 15], [15, 18], [17, 20]]
            ]
        },
        {
            type: GeoShapeType.Point,
            coordinates: [11, 12]
        },
        true
    ],
    [
        'multi-line contains point (false)',
        {
            type: GeoShapeType.MultiLineString,
            coordinates: [
                [[11, 11], [11, 12], [11, 13]],
                [[15, 15], [15, 18], [17, 20]]
            ]
        },
        {
            type: GeoShapeType.Point,
            coordinates: [19.23, 12]
        },
        false
    ],
    [
        'line contains line',
        {
            type: GeoShapeType.LineString,
            coordinates: [
                [11, 11], [11, 12], [11, 13]
            ]
        },
        {
            type: GeoShapeType.LineString,
            coordinates: [
                [11, 11], [11, 12], [11, 13]
            ]
        },
        true
    ],
    [
        'line contains line (false)',
        {
            type: GeoShapeType.LineString,
            coordinates: [
                [10, 11], [8, 12], [13, 13]
            ]
        },
        {
            type: GeoShapeType.LineString,
            coordinates: [
                [11, 11], [11, 12], [11, 13]
            ]
        },
        false
    ],
    [
        'multi-line contains line',
        {
            type: GeoShapeType.MultiLineString,
            coordinates: [
                [[11, 11], [11, 12], [11, 13]],
                [[15, 15], [15, 18], [17, 20]]
            ]
        },
        {
            type: GeoShapeType.LineString,
            coordinates: [
                [11, 11], [11, 12], [11, 13]
            ]
        },
        true
    ],
    [
        'multi-line contains line (false)',
        {
            type: GeoShapeType.MultiLineString,
            coordinates: [
                [[11, 11], [11, 12], [11, 13]],
                [[15, 15], [15, 18], [17, 20]]
            ]
        },
        {
            type: GeoShapeType.LineString,
            coordinates: [
                [10, 11], [11, 12], [11, 13]
            ]
        },
        false
    ],
    [
        'line contains multi-line (false)',
        {
            type: GeoShapeType.LineString,
            coordinates: [
                [11, 11], [11, 12], [11, 13]
            ]
        },
        {
            type: GeoShapeType.MultiLineString,
            coordinates: [
                [[11, 11], [11, 12], [11, 13]],
                [[15, 15], [15, 18], [17, 20]]
            ]
        },
        false
    ],
    [
        'multi-line contains multi-line',
        {
            type: GeoShapeType.MultiLineString,
            coordinates: [
                [[11, 11], [11, 12], [11, 13]],
                [[15, 15], [15, 18], [17, 20]]
            ]
        },
        {
            type: GeoShapeType.MultiLineString,
            coordinates: [
                [[11, 11], [11, 12], [11, 13]],
                [[15, 15], [15, 18], [17, 20]]
            ]
        },
        true
    ],
    [
        'multi-line contains multi-line (false)',
        {
            type: GeoShapeType.MultiLineString,
            coordinates: [
                [[11, 11], [11, 12], [11, 13]],
                [[15, 15], [15, 18], [17, 20]]
            ]
        },
        {
            type: GeoShapeType.MultiLineString,
            coordinates: [
                [[11, 11], [11, 12], [11, 13]],
                [[15, 15], [15, 17], [17, 20]]
            ]
        },
        false
    ],
    [
        'line contains polygon (false)',
        {
            type: GeoShapeType.LineString,
            coordinates: [
                [10, 11], [8, 12], [13, 13]
            ]
        },
        {
            type: GeoShapeType.Polygon,
            coordinates: [[[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]]]
        },
        false
    ],
    [
        'multi-line contains polygon (false)',
        {
            type: GeoShapeType.MultiLineString,
            coordinates: [
                [[11, 11], [11, 12], [11, 13]],
                [[15, 15], [15, 18], [17, 20]]
            ]
        },
        {
            type: GeoShapeType.Polygon,
            coordinates: [[[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]]]
        },
        false
    ],
    [
        'line contains multi-polygon (false)',
        {
            type: GeoShapeType.LineString,
            coordinates: [
                [10, 11], [8, 12], [13, 13]
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
        'multi-line contains multi-polygon (false)',
        {
            type: GeoShapeType.MultiLineString,
            coordinates: [
                [[11, 11], [11, 12], [11, 13]],
                [[15, 15], [15, 18], [17, 20]]
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
        'polygon contains line',
        {
            type: GeoShapeType.Polygon,
            coordinates: [[[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]]]
        },
        {
            type: GeoShapeType.LineString,
            coordinates: [
                [11, 11], [11, 12], [11, 13]
            ]
        },
        true
    ],
    [
        'polygon contains multi-line',
        {
            type: GeoShapeType.Polygon,
            coordinates: [[[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]]]
        },
        {
            type: GeoShapeType.MultiLineString,
            coordinates: [
                [[11, 11], [11, 12], [11, 13]],
                [[15, 15], [15, 18], [17, 20]]
            ]
        },
        true
    ],
    [
        'polygon with holes contains line',
        {
            type: GeoShapeType.Polygon,
            coordinates: [
                [[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]],
                [[10, 10], [90, 10], [90, 50], [10, 50], [10, 10]]
            ]
        },
        {
            type: GeoShapeType.LineString,
            coordinates: [
                [3, 1], [3, 2], [3, 3]
            ]
        },
        true
    ],
    [
        'polygon with holes contains multi-line',
        {
            type: GeoShapeType.Polygon,
            coordinates: [
                [[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]],
                [[10, 10], [90, 10], [90, 50], [10, 50], [10, 10]]
            ]
        },
        {
            type: GeoShapeType.MultiLineString,
            coordinates: [
                [[1, 1], [1, 2], [1, 3]],
                [[5, 1], [5, 2], [5, 8]]
            ]
        },
        true
    ],
    [
        'polygon with holes contains line (false)',
        {
            type: GeoShapeType.Polygon,
            coordinates: [
                [[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]],
                [[10, 10], [90, 10], [90, 50], [10, 50], [10, 10]]
            ]
        },
        {
            type: GeoShapeType.LineString,
            coordinates: [
                [13, 13], [13, 14], [13, 15]
            ]
        },
        false
    ],
    [
        'polygon with holes contains multi-line (false)',
        {
            type: GeoShapeType.Polygon,
            coordinates: [
                [[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]],
                [[10, 10], [90, 10], [90, 50], [10, 50], [10, 10]]
            ]
        },
        {
            type: GeoShapeType.MultiLineString,
            coordinates: [
                [[5, 1], [5, 2], [12, 32], [44, 72], [5, 8]],
                [[5, 1], [5, 2], [5, 8]]
            ]
        },
        false
    ],
    [
        'multi-polygon contains line',
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
            type: GeoShapeType.LineString,
            coordinates: [
                [33, 33], [33, 34], [33, 35]
            ]
        },
        true
    ],
    [
        'multi-polygon contains multi-line',
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
            type: GeoShapeType.MultiLineString,
            coordinates: [
                [[11, 11], [15, 12], [12, 18]],
                [[31, 31], [35, 32], [35, 38]]
            ]
        },
        true
    ],
    [
        'multi-polygon contains line (false)',
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
            type: GeoShapeType.LineString,
            coordinates: [
                [53, 33], [53, 34], [53, 35]
            ]
        },
        false
    ],
    [
        'multi-polygon contains multi-line (false)',
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
            type: GeoShapeType.MultiLineString,
            coordinates: [
                [[11, 1], [15, 3], [12, 4]],
                [[31, 31], [35, 32], [35, 38]]
            ]
        },
        false
    ],
    [
        'multi-polygon with holes contains line (false)',
        {
            type: GeoShapeType.MultiPolygon,
            coordinates: [
                [
                    [[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]],
                    [[10, 10], [90, 10], [90, 50], [10, 50], [10, 10]]
                ],
                [
                    [[60, 60], [70, 60], [70, 100], [60, 100], [60, 60]],
                ]
            ]
        },
        {
            type: GeoShapeType.LineString,
            coordinates: [[13, 13], [13, 14], [13, 15]]
        },
        false
    ],
    [
        'multi-polygon with holes contains multi-line (false)',
        {
            type: GeoShapeType.MultiPolygon,
            coordinates: [
                [
                    [[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]],
                    [[10, 10], [90, 10], [90, 50], [10, 50], [10, 10]]
                ],
                [
                    [[60, 60], [70, 60], [70, 100], [60, 100], [60, 60]],
                ]
            ]
        },
        {
            type: GeoShapeType.MultiLineString,
            coordinates: [
                [[13, 13], [13, 14], [13, 15]],
                [[31, 31], [35, 32], [35, 38]]
            ]
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
        'polygon contains multi-polygon',
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
        'polygon contains multi-polygon (false)',
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
        'polygon with holes contains multi-polygon',
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
        'multi-polygon contains multi-polygon (in separate polys)',
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
        'multi-polygon with holes contains point',
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
        'multi-polygon with holes contains point (false)',
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
        'multi-polygon with holes contains polygon (false)',
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
        'multi-polygon with holes contains polygon',
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
        'multi-polygon with holes contains multi-polygon',
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
        'multi-polygon with holes contains multi-polygon (false)',
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
        'multi-polygon with holes contains itself (true)',
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
    test.each(geoContainsTestCases)('%s', (_msg, firstGeo, secondGeo, output) => {
        expect(geoContains(firstGeo, secondGeo)).toEqual(output);
    });
});

describe('->geoContainsFP', () => {
    test.each(geoContainsTestCases)('%s', (_msg, firstGeo, secondGeo, output) => {
        expect(geoContainsFP(secondGeo)(firstGeo)).toEqual(output);
    });
});
