import { xLuceneFieldType } from '@terascope/types';
import { NodeType, Range, RangeNode } from '../../src/index.js';
import { TestCase } from './interfaces.js';
import { dateMath } from './range-date-math.js';

export default ([
    ['count: >=10',
        'gte ranges',
        {
            type: NodeType.Range,
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
    ['count: >=$foo',
        'gte ranges with variables',
        {
            type: NodeType.Range,
            field: 'count',
            left: {
                operator: 'gte',
                field_type: xLuceneFieldType.Integer,
                value: { type: 'value', value: 10 }
            }
        },
        { count: xLuceneFieldType.Integer },
        { foo: 10 }],
    ['count:>10',
        'gt ranges',
        {
            type: NodeType.Range,
            field: 'count',
            left: {
                operator: 'gt',
                field_type: xLuceneFieldType.Integer,
                value: { type: 'value', value: 10 }
            }
        }],
    ['count:<=20.10',
        'lte ranges',
        {
            type: NodeType.Range,
            field: 'count',
            left: {
                operator: 'lte',
                field_type: xLuceneFieldType.Float,
                value: { type: 'value', value: 20.10 }
            }
        }],
    ['count:<20',
        'lt ranges',
        {
            type: NodeType.Range,
            field: 'count',
            left: {
                operator: 'lt',
                field_type: xLuceneFieldType.Integer,
                value: { type: 'value', value: 20 }
            }
        }],
    ['count:[1 TO 5]',
        'inclusive ranges with integers',
        {
            type: NodeType.Range,
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
        }],
    ['count:[$foo TO $bar]',
        'inclusive ranges with integers with variables',
        {
            type: NodeType.Range,
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
        { count: xLuceneFieldType.Integer },
        { foo: 1, bar: 5 }],
    ['count:[1.5 TO 5.3]',
        'inclusive ranges with floats',
        {
            type: NodeType.Range,
            field: 'count',
            left: {
                operator: 'gte',
                field_type: xLuceneFieldType.Float,
                value: { type: 'value', value: 1.5 }
            },
            right: {
                operator: 'lte',
                field_type: xLuceneFieldType.Float,
                value: { type: 'value', value: 5.3 }
            }
        }],
    [
        'count:[1.5 TO 5.3]',
        'inclusive ranges with floats but with a type of integer',
        {
            type: NodeType.Range,
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
            type: NodeType.Range,
            field: 'count',
            left: {
                operator: 'gte',
                field_type: xLuceneFieldType.String,
                value: { type: 'value', value: '1.5' }
            },
            right: {
                operator: 'lte',
                field_type: xLuceneFieldType.String,
                value: { type: 'value', value: '5.3' }
            }
        },
        {
            count: xLuceneFieldType.String
        }
    ],
    ['count:{2 TO 6]',
        'exclusive and inclusive ranges with integers',
        {
            type: NodeType.Range,
            field: 'count',
            left: {
                operator: 'gt',
                field_type: xLuceneFieldType.Integer,
                value: { type: 'value', value: 2 }
            },
            right: {
                operator: 'lte',
                field_type: xLuceneFieldType.Integer,
                value: { type: 'value', value: 6 }
            }
        }],
    ['count:{2 TO *]',
        'float range values to infinity',
        {
            type: NodeType.Range,
            field: 'count',
            left: {
                operator: 'gt',
                field_type: xLuceneFieldType.Float,
                value: { type: 'value', value: 2 }
            },
            right: {
                type: NodeType.Term,
                operator: 'lte',
                field_type: xLuceneFieldType.Float,
                value: { type: 'value', value: Number.POSITIVE_INFINITY }
            }
        },
        { count: xLuceneFieldType.Float }
    ],
    ['count:{2 TO *]',
        'integer range values to infinity',
        {
            type: NodeType.Range,
            field: 'count',
            left: {
                operator: 'gt',
                field_type: xLuceneFieldType.Integer,
                value: { type: 'value', value: 2 }
            },
            right: {
                type: NodeType.Term,
                operator: 'lte',
                field_type: xLuceneFieldType.Integer,
                value: { type: 'value', value: Number.POSITIVE_INFINITY }
            }
        },
        { count: xLuceneFieldType.Integer }
    ],
    ['count:{1.5 TO 5.3}',
        'exclusive ranges with floats',
        {
            type: NodeType.Range,
            field: 'count',
            left: {
                operator: 'gt',
                field_type: xLuceneFieldType.Float,
                value: { type: 'value', value: 1.5 }
            },
            right: {
                operator: 'lt',
                field_type: xLuceneFieldType.Float,
                value: { type: 'value', value: 5.3 }
            }
        }],
    ['val:[alpha TO omega]',
        'inclusive range of strings',
        {
            type: NodeType.Range,
            field: 'val',
            left: {
                operator: 'gte',
                field_type: xLuceneFieldType.String,
                restricted: true,
                value: { type: 'value', value: 'alpha' }
            },
            right: {
                operator: 'lte',
                field_type: xLuceneFieldType.String,
                restricted: true,
                value: { type: 'value', value: 'omega' }
            }
        }],
    ['val:{"alpha" TO "omega"}',
        'exclusive range of quoted',
        {
            type: NodeType.Range,
            field: 'val',
            left: {
                operator: 'gt',
                field_type: xLuceneFieldType.String,
                quoted: true,
                value: { type: 'value', value: 'alpha' }
            },
            right: {
                operator: 'lt',
                field_type: xLuceneFieldType.String,
                quoted: true,
                value: { type: 'value', value: 'omega' }
            }
        }],
    ['val:[2012-01-01 TO 2012-12-31]',
        'inclusive date range',
        {
            type: NodeType.Range,
            field: 'val',
            left: {
                operator: 'gte',
                field_type: xLuceneFieldType.String,
                restricted: true,
                value: { type: 'value', value: '2012-01-01' }
            },
            right: {
                operator: 'lte',
                field_type: xLuceneFieldType.String,
                restricted: true,
                value: { type: 'value', value: '2012-12-31' }
            }
        }],
    ['val:[2012-01-01 TO *]',
        'right unbounded date range',
        {
            type: NodeType.Range,
            field: 'val',
            left: {
                operator: 'gte',
                field_type: xLuceneFieldType.String,
                restricted: true,
                value: { type: 'value', value: '2012-01-01' }
            },
            right: {
                operator: 'lte',
                field_type: xLuceneFieldType.Integer,
                value: { type: 'value', value: Number.POSITIVE_INFINITY }
            }
        }],
    ['val:[* TO 10}',
        'left unbounded range',
        {
            type: NodeType.Range,
            field: 'val',
            left: {
                operator: 'gte',
                field_type: xLuceneFieldType.Integer,
                value: { type: 'value', value: Number.NEGATIVE_INFINITY }
            },
            right: {
                operator: 'lt',
                field_type: xLuceneFieldType.Integer,
                value: { type: 'value', value: 10 }
            }
        }],
    [
        'date:[2020-02-10T10:06:06.0 TO 2020-02-10T10:06:07.199999999999999]',
        'left unbounded range',
        {
            type: NodeType.Range,
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
        'ip range',
        {
            type: NodeType.Range,
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
        } as Range,
        { ip_range: xLuceneFieldType.IPRange },
    ],
    [
        'ip_range:"1.2.3.5"',
        'ip range',
        {
            type: NodeType.Range,
            field: 'ip_range',
            left: {
                field_type: xLuceneFieldType.IP,
                value: { type: 'value', value: '1.2.3.5' },
                operator: 'gte'
            },
            right: {
                operator: 'lte',
                field_type: xLuceneFieldType.IP,
                value: { type: 'value', value: '1.2.3.5' }
            }
        } as Range,
        { ip_range: xLuceneFieldType.IPRange },
    ],
    [
        'ip_range:"2001:DB8::0/120"',
        'ip range',
        {
            type: NodeType.Range,
            field: 'ip_range',
            left: {
                field_type: xLuceneFieldType.IP,
                value: { type: 'value', value: '2001:db8::' },
                operator: 'gte'
            },
            right: {
                operator: 'lte',
                field_type: xLuceneFieldType.IP,
                value: { type: 'value', value: '2001:db8::ff' }
            }
        } as Range,
        { ip_range: xLuceneFieldType.IPRange },
    ],
    [
        'ip_range:"2001:DB8::64"',
        'ip range',
        {
            type: NodeType.Range,
            field: 'ip_range',
            left: {
                field_type: xLuceneFieldType.IP,
                value: { type: 'value', value: '2001:db8::64' },
                operator: 'gte'
            },
            right: {
                operator: 'lte',
                field_type: xLuceneFieldType.IP,
                value: { type: 'value', value: '2001:db8::64' }
            }
        } as Range,
        { ip_range: xLuceneFieldType.IPRange },
    ],
    ['val:[$foo TO *]',
        'resolving variables when range includes infinity',
        {
            type: NodeType.Range,
            field: 'val',
            left: {
                type: NodeType.Term,
                operator: 'gte',
                value: { type: 'value', value: 2 }
            },
            right: {
                type: NodeType.Term,
                operator: 'lte',
                field_type: xLuceneFieldType.Integer,
                value: { type: 'value', value: Number.POSITIVE_INFINITY }
            }
        },
        undefined,
        { foo: 2 }
    ],
    ['val:[2 TO $foo]',
        'resolving variables when range includes infinity variable',
        {
            type: NodeType.Range,
            field: 'val',
            left: {
                type: NodeType.Term,
                operator: 'gte',
                field_type: xLuceneFieldType.Integer,
                value: { type: 'value', value: 2 }
            },
            right: {
                type: NodeType.Term,
                operator: 'lte',
                value: { type: 'value', value: '*' }
            }
        },
        undefined,
        { foo: '*' }
    ],
] as TestCase[]).concat(dateMath) as TestCase[];

export const filterNilRange: TestCase[] = [
    [
        'count: >=$foo',
        'gte ranges',
        {
            type: NodeType.Empty,
        },
        { count: xLuceneFieldType.Integer }
    ],
    [
        'count:[$foo TO $bar]',
        'inclusive ranges with integers',
        {
            type: NodeType.Range,
            field: 'count',
            left: {
                operator: 'lte',
                field_type: xLuceneFieldType.Integer,
                value: { type: 'variable', value: 'bar' }
            }
        } as Range,
        { count: xLuceneFieldType.Integer },
        { bar: 5 },
        {
            type: NodeType.Range,
            field: 'count',
            left: {
                operator: 'lte',
                field_type: xLuceneFieldType.Integer,
                value: { type: 'value', value: 5 }
            }
        } as Range,
    ],
    [
        'count:{$foo TO $bar}',
        'exclusive ranges with integers',
        {
            type: NodeType.Range,
            field: 'count',
            left: {
                operator: 'gt',
                field_type: xLuceneFieldType.Integer,
                value: { type: 'variable', value: 'foo' }
            },
        } as Range,
        { count: xLuceneFieldType.Integer },
        { foo: 1 },
        {
            type: NodeType.Range,
            field: 'count',
            left: {
                operator: 'gt',
                field_type: xLuceneFieldType.Integer,
                value: { type: 'value', value: 1 }
            },
        } as Range,
    ],
    [
        'count:[$foo TO $bar]',
        'inclusive/exclusive ranges with integers',
        {
            type: NodeType.Empty,
        },
        { count: xLuceneFieldType.Integer }
    ],
    [
        'val:[$foo TO omega]',
        'inclusive range of strings',
        {
            type: NodeType.Range,
            field: 'val',
            left: {
                operator: 'lte',
                field_type: xLuceneFieldType.String,
                restricted: true,
                value: { type: 'value', value: 'omega' }
            } as RangeNode
        } as Range
    ],
    [
        'val:[$foo TO 2012-01-01]',
        'inclusive date range',
        {
            type: NodeType.Range,
            field: 'val',
            left: {
                operator: 'lte',
                field_type: xLuceneFieldType.String,
                restricted: true,
                value: { type: 'value', value: '2012-01-01' }
            } as RangeNode,
        } as Range
    ],
    [
        'ip_range:$foo',
        'ip range',
        {
            type: NodeType.Empty,
        },
        { ip_range: xLuceneFieldType.IPRange },
    ],
];
