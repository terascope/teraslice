import { ASTType } from '../../../src';
import { TestCase } from './interfaces';

export default [
    [
        'location:(_geo_point_:"33.435518,-111.873616" _geo_distance_:5000m)',
        'a geo distance query with point double quoted in the old way (_geo_point_)',
        {
            type: ASTType.GeoDistance,
            field: 'location',
            lat: 33.435518,
            lon: -111.873616,
            distance: 5000,
            unit: 'meters',
        },
    ],
    [
        'location:geoDistance(point:"33.435518,-111.873616", distance:"5000m")',
        'a geo distance query with point double quoted',
        {
            type: ASTType.GeoDistance,
            field: 'location',
            lat: 33.435518,
            lon: -111.873616,
            distance: 5000,
            unit: 'meters',
        },
    ],
    [
        "location:geoDistance(point:'33.435518,-111.873616' distance:5000m)",
        'a geo distance query with point single quoted',
        {
            type: ASTType.GeoDistance,
            field: 'location',
            lat: 33.435518,
            lon: -111.873616,
            distance: 5000,
            unit: 'meters',
        },
    ],
    [
        "location:geoDistance(point:'33.435518,-111.873616' distance:'5000m')",
        'a geo distance query with point single quoted and geo_distance single quoted',
        {
            type: ASTType.GeoDistance,
            field: 'location',
            lat: 33.435518,
            lon: -111.873616,
            distance: 5000,
            unit: 'meters',
        },
    ],
    [
        'location:geoDistance(point:"33.435518,-111.873616" distance:"5000m")',
        'a quoted geo point',
        {
            type: ASTType.GeoDistance,
            field: 'location',
            lat: 33.435518,
            lon: -111.873616,
            distance: 5000,
            unit: 'meters',
        },
    ],
    [
        'location:geoDistance(distance:"5000m" point:"33.435518,-111.873616")',
        'a geo distance query with distance first',
        {
            type: ASTType.GeoDistance,
            field: 'location',
            lat: 33.435518,
            lon: -111.873616,
            distance: 5000,
            unit: 'meters',
        },
    ],
    [
        'location:(_geo_box_top_left_:"33.906320,-112.758421" _geo_box_bottom_right_:"32.813646,-111.058902")',
        'a geo point query top left and bottom right in the old way',
        {
            type: ASTType.GeoBoundingBox,
            field: 'location',
            top_left: {
                lat: 33.90632,
                lon: -112.758421,
            },
            bottom_right: {
                lat: 32.813646,
                lon: -111.058902,
            },
        },
    ],
    [
        'location:geoBox(top_left:"33.906320,-112.758421", bottom_right:"32.813646,-111.058902")',
        'a geo point query top left and bottom right',
        {
            type: ASTType.GeoBoundingBox,
            field: 'location',
            top_left: {
                lat: 33.90632,
                lon: -112.758421,
            },
            bottom_right: {
                lat: 32.813646,
                lon: -111.058902,
            },
        },
    ],
    [
        'location:geoBox(bottom_right:"32.813646,-111.058902" top_left:"33.906320,-112.758421")',
        'a geo point query bottom right and top left',
        {
            type: ASTType.GeoBoundingBox,
            field: 'location',
            top_left: {
                lat: 33.90632,
                lon: -112.758421,
            },
            bottom_right: {
                lat: 32.813646,
                lon: -111.058902,
            },
        },
    ],
    [
        'location:geoPolygon(points:["123.43,223.43", "102.3,123.4", "99.3,154.4"])',
        'a geo polygon query',
        {
            type: 'geo-polygon',
            field: 'location',
            points: [
                {
                    lat: 123.43,
                    lon: 223.43
                },
                {
                    lat: 102.3,
                    lon: 123.4
                },
                {
                    lat: 99.3,
                    lon: 154.4
                }
            ]
        }
    ]
] as TestCase[];
