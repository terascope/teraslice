import 'jest-extended';
import { GeoShapeType, GeoInput } from '@terascope/types';
import { geoDisjointFP, geoDisjoint } from '../src/geo';

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
