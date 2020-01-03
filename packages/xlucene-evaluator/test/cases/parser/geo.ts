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
        'location:(_geo_distance_:5000m _geo_point_:"33.435518,-111.873616")',
        'old quoted geo point with space between fn name and parens',
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
        'location:(_geo_box_bottom_right_:"32.813646,-111.058902" _geo_box_top_left_:"33.906320,-112.758421")',
        'an old geo point query bottom right and top left',
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
        'location:geoDistance(point:"33.435518,-111.873616", distance:"5000m", third: "data")',
        'a geo distance query with point double quoted',
        {
            type: ASTType.Function,
            field: 'location',
            name: 'geoDistance'
        },
    ],
    [
        'location:geoBox(bottom_right:"32.813646,-111.058902" top_left:"33.906320,-112.758421")',
        'a geo point query bottom right and top left',
        {
            type: ASTType.Function,
            field: 'location',
            name: 'geoBox'
        },
    ],
    [
        'location:geoPolygon(points:["60.43,111.43", "70.3,123.4", "65.23,118.34"])',
        'a geo polygon query',
        {
            type: ASTType.Function,
            field: 'location',
            name: 'geoPolygon'
        },
    ],
    [
        'location:geoPolygon(points:$points)',
        'a geo polygon query with a variable',
        {
            type: ASTType.Function,
            field: 'location',
            name: 'geoPolygon'
        },
        {},
        { points: ['60.43,111.43', '70.3,123.4', '65.23,118.34'] }
    ],
    [
        'location:geoPolygon(points:$points, relation: $relation)',
        'a geo polygon query with variables and commas',
        {
            type: ASTType.Function,
            field: 'location',
            name: 'geoPolygon'
        },
        {},
        { points: ['60.43,111.43', '70.3,123.4', '65.23,118.34'], relation: 'within' }
    ]
] as TestCase[];
