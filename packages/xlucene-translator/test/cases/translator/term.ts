import { escapeString } from '@terascope/core-utils';
import { xLuceneFieldType } from '@terascope/types';
import { TestCase } from './interfaces.js';

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
                hello: {
                    value: 'w.*ld',
                    flags: 'COMPLEMENT|EMPTY|INTERSECTION|INTERVAL'
                }
            },
        },
    ],
    [
        'firstName.text:/[A-Z]+/',
        'query.constant_score.filter',
        {
            query_string: {
                fields: ['firstName.text'],
                query: '/[A-Z]+/',
            },
        },
        {
            type_config: {
                firstName: xLuceneFieldType.String
            }
        }
    ],
    [
        'other.value:/[a-z]{1,3}/',
        'query.constant_score.filter',
        {
            regexp: {
                'other.value': {
                    value: '[a-z]{1,3}',
                    flags: 'COMPLEMENT|EMPTY|INTERSECTION|INTERVAL'
                }
            },
        },
        {
            type_config: {
                other: xLuceneFieldType.String,
                'other.value': xLuceneFieldType.String
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
        'foo:\'"bar"\'',
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
        'phone.tokens:3848',
        'query.constant_score.filter',
        {
            match: {
                'phone.tokens': {
                    operator: 'and',
                    query: '3848'
                },
            },
        },
        {
            type_config: {
                phone: 'string',
            }
        }
    ],
    [
        'name:test',
        'query.constant_score.filter',
        {
            match: {
                name: {
                    operator: 'and',
                    query: 'test'
                },
            },
        },
        {
            type_config: {
                name: '~string',
            }
        }
    ],
    [
        'other_name:test*',
        'query.constant_score.filter',
        {
            query_string: {
                fields: ['other_name'],
                query: 'test*'
            },
        },
        {
            type_config: {
                other_name: '~string',
            }
        }
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
                    field_one: {
                        value: 'wo.*d',
                        flags: 'COMPLEMENT|EMPTY|INTERSECTION|INTERVAL'
                    }
                }
            },
            {
                regexp: {
                    field_two: {
                        value: 'wo.*d',
                        flags: 'COMPLEMENT|EMPTY|INTERSECTION|INTERVAL'
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
                field_one: xLuceneFieldType.GeoPoint,
                field_two: xLuceneFieldType.GeoPoint
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
                field_one: xLuceneFieldType.GeoPoint,
                field_two: xLuceneFieldType.GeoPoint
            }
        }
    ],
] as TestCase[];
