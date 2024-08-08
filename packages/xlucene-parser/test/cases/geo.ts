import { FunctionNode, NodeType } from '../../src/index.js';
import { TestCase } from './interfaces.js';

export default [
    [
        'location:geoDistance(point:"33.435518,-111.873616", distance:"5000m", third: "data")',
        'a geo distance query with point double quoted',
        {
            type: NodeType.Function,
            field: 'location',
            name: 'geoDistance'
        },
    ],
    [
        'location:geoBox(bottom_right:"32.813646,-111.058902" top_left:"33.906320,-112.758421")',
        'a geo point query bottom right and top left',
        {
            type: NodeType.Function,
            field: 'location',
            name: 'geoBox'
        },
    ],
    [
        'location:geoPolygon(points:["60.43,111.43", "70.3,123.4", "65.23,118.34"])',
        'a geo polygon query',
        {
            type: NodeType.Function,
            field: 'location',
            name: 'geoPolygon'
        },
    ],
    [
        'location:geoPolygon(points:$points)',
        'a geo polygon query with a variable',
        {
            type: NodeType.Function,
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
            type: NodeType.Function,
            field: 'location',
            name: 'geoPolygon'
        } as FunctionNode,
        {},
        { points: ['60.43,111.43', '70.3,123.4', '65.23,118.34'], relation: 'within' }
    ]
] as TestCase[];

/** NOTE: ASTs are correct but that doesn't mean all the queries will pass */
export const filterNilGeo: TestCase[] = [
    [
        'location:geoDistance(point:"33.435518,-111.873616", distance:$foo, third: "data")',
        'a geo distance query with point double quoted & distance variable undefined', {
            type: NodeType.Function,
            field: 'location',
            name: 'geoDistance'
        } as FunctionNode,
    ],
    [
        'location:geoDistance(point:$foo, distance:$bar, third:$baz)',
        'a geo distance query with point/distance/third as undefined variables', {
            type: NodeType.Empty,
        },
    ],
    [
        'location:geoBox(bottom_right:$foo top_left:"33.906320,-112.758421")',
        'a geo point query bottom right and top left variables, 1 missing', {
            type: NodeType.Function,
            field: 'location',
            name: 'geoBox'
        } as FunctionNode,
    ],
    [
        'location:geoBox(bottom_right:$foo top_left:$bar)',
        'a geo point query bottom right and top left variables, both missing', {
            type: NodeType.Empty,
        },
    ],
    [
        'location:geoPolygon(points:["60.43,111.43", $foo, "65.23,118.34"])',
        'a geo polygon query with 1 point as missing variable',
        {
            type: NodeType.Function,
            field: 'location',
            name: 'geoPolygon'
        } as FunctionNode,
    ],
    [
        'location:geoPolygon(points:[$foo, $bar, $buz])',
        'a geo polygon query with points as 3 different variables',
        {
            type: NodeType.Empty
        },
    ],
    [
        'location:geoPolygon(points:$points)',
        'a geo polygon query with points as 1 variable',
        {
            type: NodeType.Empty,
        },
    ],
    [
        'location:geoPolygon(points:$points, relation: $relation)',
        'a geo polygon query with variables and commas, relation variable',
        {
            type: NodeType.Function,
            field: 'location',
            name: 'geoPolygon'
        } as FunctionNode,
        {},
        { points: ['60.43,111.43', '70.3,123.4', '65.23,118.34'] },
        {
            type: NodeType.Function,
            field: 'location',
            name: 'geoPolygon'
        } as FunctionNode,
    ]
];
