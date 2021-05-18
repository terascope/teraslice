import 'jest-extended';
import { GeoShapeType, GeoInput } from '@terascope/types';
import { geoIntersectsFP, geoIntersects } from '../src/geo';

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
