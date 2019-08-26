import { FieldType, ASTType } from '../../../src';
import { TestCase } from './interfaces';

export default [
    ['count: >=10', 'gte ranges', {
        type: ASTType.Range,
        field: 'count',
        left: {
            operator: 'gte',
            field_type: FieldType.Integer,
            value: 10
        }
    }],
    ['count:>10', 'gt ranges', {
        type: ASTType.Range,
        field: 'count',
        left: {
            operator: 'gt',
            field_type: FieldType.Integer,
            value: 10,
        }
    }],
    ['count:<=20.10', 'lte ranges', {
        type: ASTType.Range,
        field: 'count',
        left: {
            operator: 'lte',
            field_type: FieldType.Float,
            value: 20.10
        }
    }],
    ['count:<20', 'lt ranges', {
        type: ASTType.Range,
        field: 'count',
        left: {
            operator: 'lt',
            field_type: FieldType.Integer,
            value: 20
        }
    }],
    ['count:[1 TO 5]', 'inclusive ranges with integers', {
        type: ASTType.Range,
        field: 'count',
        left: {
            operator: 'gte',
            field_type: FieldType.Integer,
            value: 1,
        },
        right: {
            operator: 'lte',
            field_type: FieldType.Integer,
            value: 5,
        }
    }],
    ['count:[1.5 TO 5.3]', 'inclusive ranges with floats', {
        type: ASTType.Range,
        field: 'count',
        left: {
            operator: 'gte',
            field_type: FieldType.Float,
            value: 1.5,
        },
        right: {
            operator: 'lte',
            field_type: FieldType.Float,
            value: 5.3,
        }
    }],
    [
        'count:[1.5 TO 5.3]',
        'inclusive ranges with floats but with a type of integer',
        {
            type: ASTType.Range,
            field: 'count',
            left: {
                operator: 'gte',
                field_type: FieldType.Integer,
                value: 1,
            },
            right: {
                operator: 'lte',
                field_type: FieldType.Integer,
                value: 5,
            }
        },
        {
            count: FieldType.Integer
        }
    ],
    [
        'count:[1.5 TO 5.3]',
        'inclusive ranges with floats but with a type of string',
        {
            type: ASTType.Range,
            field: 'count',
            left: {
                operator: 'gte',
                field_type: FieldType.String,
                value: '1.5',
            },
            right: {
                operator: 'lte',
                field_type: FieldType.String,
                value: '5.3',
            }
        },
        {
            count: FieldType.String
        }
    ],
    ['count:{2 TO 6]', 'exclusive and inclusive ranges with integers', {
        type: ASTType.Range,
        field: 'count',
        left: {
            operator: 'gt',
            field_type: FieldType.Integer,
            value: 2,
        },
        right: {
            operator: 'lte',
            field_type: FieldType.Integer,
            value: 6
        }
    }],
    ['count:{1.5 TO 5.3}', 'exclusive ranges with floats', {
        type: ASTType.Range,
        field: 'count',
        left: {
            operator: 'gt',
            field_type: FieldType.Float,
            value: 1.5,
        },
        right: {
            operator: 'lt',
            field_type: FieldType.Float,
            value: 5.3,
        }
    }],
    ['val:[alpha TO omega]', 'inclusive range of strings', {
        type: ASTType.Range,
        field: 'val',
        left: {
            operator: 'gte',
            field_type: FieldType.String,
            restricted: true,
            value: 'alpha',
        },
        right: {
            operator: 'lte',
            field_type: FieldType.String,
            restricted: true,
            value: 'omega',
        }
    }],
    ['val:{"alpha" TO "omega"}', 'exclusive range of quoted', {
        type: ASTType.Range,
        field: 'val',
        left: {
            operator: 'gt',
            field_type: FieldType.String,
            quoted: true,
            value: 'alpha',
        },
        right: {
            operator: 'lt',
            field_type: FieldType.String,
            quoted: true,
            value: 'omega',
        }
    }],
    ['val:[2012-01-01 TO 2012-12-31]', 'inclusive date range', {
        type: ASTType.Range,
        field: 'val',
        left: {
            operator: 'gte',
            field_type: FieldType.String,
            restricted: true,
            value: '2012-01-01',
        },
        right: {
            operator: 'lte',
            field_type: FieldType.String,
            restricted: true,
            value: '2012-12-31',
        }
    }],
    ['val:[2012-01-01 TO *]', 'right unbounded date range', {
        type: ASTType.Range,
        field: 'val',
        left: {
            operator: 'gte',
            field_type: FieldType.String,
            restricted: true,
            value: '2012-01-01',
        },
        right: {
            operator: 'lte',
            field_type: FieldType.Integer,
            value: Number.POSITIVE_INFINITY,
        }
    }],
    ['val:[* TO 10}', 'left unbounded range', {
        type: ASTType.Range,
        field: 'val',
        left: {
            operator: 'gte',
            field_type: FieldType.Integer,
            value: Number.NEGATIVE_INFINITY,
        },
        right: {
            operator: 'lt',
            field_type: FieldType.Integer,
            value: 10,
        }
    }],
] as TestCase[];
