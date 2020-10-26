import { ASTType } from '../../src';
import { TestCase } from './interfaces';

export default [
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
