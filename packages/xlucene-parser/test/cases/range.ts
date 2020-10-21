import { xLuceneFieldType } from '@terascope/types';
import { ASTType } from '../../src';
import { TestCase } from './interfaces';

export default [
    ['count: >=10', 'gte ranges', {
        type: ASTType.Range,
        field: 'count',
        left: {
            operator: 'gte',
            field_type: xLuceneFieldType.Integer,
            value: {
                type: 'value',
                value: 10
            }
        }
    }],
    ['count: >=$foo', 'gte ranges with variables', {
        type: ASTType.Range,
        field: 'count',
        left: {
            operator: 'gte',
            field_type: xLuceneFieldType.Integer,
            value: { type: 'variable', value: 'foo' }
        }
    }, { count: xLuceneFieldType.Integer }, { foo: 10 }],
    ['count:>10', 'gt ranges', {
        type: ASTType.Range,
        field: 'count',
        left: {
            operator: 'gt',
            field_type: xLuceneFieldType.Integer,
            value: { type: 'value', value: 10, }
        }
    }],
    ['count:<=20.10', 'lte ranges', {
        type: ASTType.Range,
        field: 'count',
        left: {
            operator: 'lte',
            field_type: xLuceneFieldType.Float,
            value: { type: 'value', value: 20.10 }
        }
    }],
    ['count:<20', 'lt ranges', {
        type: ASTType.Range,
        field: 'count',
        left: {
            operator: 'lt',
            field_type: xLuceneFieldType.Integer,
            value: { type: 'value', value: 20 }
        }
    }],
    ['count:[1 TO 5]', 'inclusive ranges with integers', {
        type: ASTType.Range,
        field: 'count',
        left: {
            operator: 'gte',
            field_type: xLuceneFieldType.Integer,
            value: { type: 'value', value: 1, }
        },
        right: {
            operator: 'lte',
            field_type: xLuceneFieldType.Integer,
            value: { type: 'value', value: 5, }
        }
    }],
    ['count:[$foo TO $bar]', 'inclusive ranges with integers with variables', {
        type: ASTType.Range,
        field: 'count',
        left: {
            operator: 'gte',
            field_type: xLuceneFieldType.Integer,
            value: { type: 'variable', value: 'foo', }
        },
        right: {
            operator: 'lte',
            field_type: xLuceneFieldType.Integer,
            value: { type: 'variable', value: 'bar', }
        }
    }, { count: xLuceneFieldType.Integer }, { foo: 1, bar: 5 }],
    ['count:[1.5 TO 5.3]', 'inclusive ranges with floats', {
        type: ASTType.Range,
        field: 'count',
        left: {
            operator: 'gte',
            field_type: xLuceneFieldType.Float,
            value: { type: 'value', value: 1.5, }
        },
        right: {
            operator: 'lte',
            field_type: xLuceneFieldType.Float,
            value: { type: 'value', value: 5.3, }
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
                field_type: xLuceneFieldType.Integer,
                value: { type: 'value', value: 1 }
            },
            right: {
                operator: 'lte',
                field_type: xLuceneFieldType.Integer,
                value: { type: 'value', value: 5 }
            }
        },
        {
            count: xLuceneFieldType.Integer
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
                field_type: xLuceneFieldType.String,
                value: { type: 'value', value: '1.5', }
            },
            right: {
                operator: 'lte',
                field_type: xLuceneFieldType.String,
                value: { type: 'value', value: '5.3', }
            }
        },
        {
            count: xLuceneFieldType.String
        }
    ],
    ['count:{2 TO 6]', 'exclusive and inclusive ranges with integers', {
        type: ASTType.Range,
        field: 'count',
        left: {
            operator: 'gt',
            field_type: xLuceneFieldType.Integer,
            value: { type: 'value', value: 2, }
        },
        right: {
            operator: 'lte',
            field_type: xLuceneFieldType.Integer,
            value: { type: 'value', value: 6 }
        }
    }],
    ['count:{1.5 TO 5.3}', 'exclusive ranges with floats', {
        type: ASTType.Range,
        field: 'count',
        left: {
            operator: 'gt',
            field_type: xLuceneFieldType.Float,
            value: { type: 'value', value: 1.5, }
        },
        right: {
            operator: 'lt',
            field_type: xLuceneFieldType.Float,
            value: { type: 'value', value: 5.3, }
        }
    }],
    ['val:[alpha TO omega]', 'inclusive range of strings', {
        type: ASTType.Range,
        field: 'val',
        left: {
            operator: 'gte',
            field_type: xLuceneFieldType.String,
            restricted: true,
            value: { type: 'value', value: 'alpha', }
        },
        right: {
            operator: 'lte',
            field_type: xLuceneFieldType.String,
            restricted: true,
            value: { type: 'value', value: 'omega', }
        }
    }],
    ['val:{"alpha" TO "omega"}', 'exclusive range of quoted', {
        type: ASTType.Range,
        field: 'val',
        left: {
            operator: 'gt',
            field_type: xLuceneFieldType.String,
            quoted: true,
            value: { type: 'value', value: 'alpha', }
        },
        right: {
            operator: 'lt',
            field_type: xLuceneFieldType.String,
            quoted: true,
            value: { type: 'value', value: 'omega', }
        }
    }],
    ['val:[2012-01-01 TO 2012-12-31]', 'inclusive date range', {
        type: ASTType.Range,
        field: 'val',
        left: {
            operator: 'gte',
            field_type: xLuceneFieldType.String,
            restricted: true,
            value: { type: 'value', value: '2012-01-01', }
        },
        right: {
            operator: 'lte',
            field_type: xLuceneFieldType.String,
            restricted: true,
            value: { type: 'value', value: '2012-12-31', }
        }
    }],
    ['val:[2012-01-01 TO *]', 'right unbounded date range', {
        type: ASTType.Range,
        field: 'val',
        left: {
            operator: 'gte',
            field_type: xLuceneFieldType.String,
            restricted: true,
            value: { type: 'value', value: '2012-01-01', }
        },
        right: {
            operator: 'lte',
            field_type: xLuceneFieldType.Integer,
            value: { type: 'value', value: Number.POSITIVE_INFINITY, }
        }
    }],
    ['val:[* TO 10}', 'left unbounded range', {
        type: ASTType.Range,
        field: 'val',
        left: {
            operator: 'gte',
            field_type: xLuceneFieldType.Integer,
            value: { type: 'value', value: Number.NEGATIVE_INFINITY, }
        },
        right: {
            operator: 'lt',
            field_type: xLuceneFieldType.Integer,
            value: { type: 'value', value: 10, }
        }
    }],
    [
        'date:[2020-02-10T10:06:06.0 TO 2020-02-10T10:06:07.199999999999999]',
        'left unbounded range', {
            type: ASTType.Range,
            field: 'date',
            left: {
                field_type: xLuceneFieldType.Date,
                value: { type: 'value', value: '2020-02-10T10:06:06.0' },
                operator: 'gte'
            },
            right: {
                operator: 'lte',
                field_type: xLuceneFieldType.Date,
                value: { type: 'value', value: '2020-02-10T10:06:07.199999999999999' }
            }
        },
        { date: xLuceneFieldType.Date }
    ],
    [
        'ip_range:"1.2.3.0/24"',
        'ip range', {
            type: ASTType.Range,
            field: 'ip_range',
            left: {
                field_type: xLuceneFieldType.IP,
                value: { type: 'value', value: '1.2.3.0' },
                operator: 'gte'
            },
            right: {
                operator: 'lte',
                field_type: xLuceneFieldType.IP,
                value: { type: 'value', value: '1.2.3.255' }
            }
        },
        { ip_range: xLuceneFieldType.IPRange },
    ],
] as TestCase[];
