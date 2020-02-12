import { escapeString } from '@terascope/utils';
import { XluceneFieldType } from '@terascope/types';
import { TestCase } from './interfaces';

export default [
    [
        '*',
        'query.constant_score.filter',
        {
            bool: {
                filter: [],
            },
        },
    ],
    [
        'hello:world',
        'query.constant_score.filter',
        {
            match: {
                hello: {
                    operator: 'and',
                    query: 'world',
                },
            },
        },
    ],
    [
        'hello:w?rld',
        'query.constant_score.filter',
        {
            wildcard: {
                hello: 'w?rld',
            },
        },
    ],
    [
        'hello:/w.*ld/',
        'query.constant_score.filter',
        {
            regexp: {
                hello: 'w.*ld',
            },
        },
    ],
    [
        'firstname.text:/[A-Z]+/',
        'query.constant_score.filter',
        {
            query_string: {
                fields: ['firstname.text'],
                query: '/[A-Z]+/',
            },
        },
        {
            type_config: {
                firstname: XluceneFieldType.String
            }
        }
    ],
    [
        'other.value:/[a-z]{1,3}/',
        'query.constant_score.filter',
        {
            regexp: {
                'other.value': '[a-z]{1,3}',
            },
        },
        {
            type_config: {
                other: XluceneFieldType.String,
                'other.value': XluceneFieldType.String
            }
        }
    ],
    [
        '_exists_:hello',
        'query.constant_score.filter',
        {
            exists: {
                field: 'hello',
            },
        },
    ],
    [
        'example_count:>=30',
        'query.constant_score.filter',
        {
            range: {
                example_count: {
                    gte: 30,
                },
            },
        },
    ],
    [
        'example_count:>30',
        'query.constant_score.filter',
        {
            range: {
                example_count: {
                    gt: 30,
                },
            },
        },
    ],
    [
        'example_count:<50',
        'query.constant_score.filter',
        {
            range: {
                example_count: {
                    lt: 50,
                },
            },
        },
    ],
    [
        'example_count:<=50',
        'query.constant_score.filter',
        {
            range: {
                example_count: {
                    lte: 50,
                },
            },
        },
    ],
    [
        'hello-there',
        'query.constant_score.filter',
        {
            multi_match: {
                query: 'hello-there',
            },
        },
    ],
    [
        'nested.field:hello-there',
        'query.constant_score.filter',
        {
            match: {
                'nested.field': {
                    operator: 'and',
                    query: 'hello-there',
                },
            },
        },
    ],
    [
        'field.subfield:"value=something=*"',
        'query.constant_score.filter',
        {
            match: {
                'field.subfield': {
                    operator: 'and',
                    query: 'value=something=*',
                },
            },
        },
    ],
    [
        "foo:'\"bar\"'",
        'query.constant_score.filter',
        {
            match: {
                foo: {
                    operator: 'and',
                    query: '"bar"',
                },
            },
        },
    ],
    [
        `word:"${escapeString('/value\\\\')}"`,
        'query.constant_score.filter',
        {
            match: {
                word: {
                    operator: 'and',
                    query: '/value\\\\',
                },
            },
        },
    ],
    [
        'field_*:something',
        'query.constant_score.filter.bool.should',
        [
            {
                match: {
                    field_one: {
                        operator: 'and',
                        query: 'something'
                    }
                }
            },
            {
                match: {
                    field_two: {
                        operator: 'and',
                        query: 'something'
                    }
                }
            }
        ],
        {
            type_config: {
                field_one: 'string',
                field_two: 'string'
            }
        }
    ],
    [
        'field_*:>=100',
        'query.constant_score.filter.bool.should',
        [
            {
                range: {
                    field_one: {
                        gte: 100
                    }
                }
            },
            {
                range: {
                    field_two: {
                        gte: 100
                    }
                }
            }
        ],
        {
            type_config: {
                field_one: 'integer',
                field_two: 'integer'
            }
        }
    ],
    [
        'field_*:<100',
        'query.constant_score.filter.bool.should',
        [
            {
                range: {
                    field_one: {
                        lt: 100
                    }
                }
            },
            {
                range: {
                    field_two: {
                        lt: 100
                    }
                }
            }
        ],
        {
            type_config: {
                field_one: 'integer',
                field_two: 'integer'
            }
        }
    ],
    [
        'field_*:wor?d',
        'query.constant_score.filter.bool.should',
        [
            {
                wildcard: {
                    field_one: 'wor?d'
                }
            },
            {
                wildcard: {
                    field_two: 'wor?d'
                }
            }
        ],
        {
            type_config: {
                field_one: 'string',
                field_two: 'string'
            }
        }
    ],
    [
        'field_*:/wo.*d/',
        'query.constant_score.filter.bool.should',
        [
            {
                regexp: {
                    field_one: 'wo.*d'
                }
            },
            {
                regexp: {
                    field_two: 'wo.*d'
                }
            }
        ],
        {
            type_config: {
                field_one: 'string',
                field_two: 'string'
            }
        }
    ],
    [
        'field_*:geoDistance(point:"33.435518,-111.873616", distance:"500m")',
        'query.constant_score.filter.bool.should',
        [{
            geo_distance: {
                distance: '500meters',
                field_one: {
                    lat: 33.435518,
                    lon: -111.873616,
                }
            }
        },
        {
            geo_distance: {
                distance: '500meters',
                field_two: {
                    lat: 33.435518,
                    lon: -111.873616,
                }
            }
        }
        ],
        {
            type_config: {
                field_one: XluceneFieldType.GeoPoint,
                field_two: XluceneFieldType.GeoPoint
            }
        }
    ],
    [
        'field_*:["alpha" TO "omega"]',
        'query.constant_score.filter.bool.should',
        [
            {
                range: {
                    field_one: {
                        gte: 'alpha',
                        lte: 'omega'
                    }
                }
            },
            {
                range: {
                    field_two: {
                        gte: 'alpha',
                        lte: 'omega'
                    }
                }
            }
        ],
        {
            type_config: {
                field_one: XluceneFieldType.GeoPoint,
                field_two: XluceneFieldType.GeoPoint
            }
        }
    ],
] as TestCase[];
