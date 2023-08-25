import { TestCase } from './interfaces';

export default [
    [
        'ip_range:"1.2.3.0/24"',
        'query.constant_score.filter',
        {
            range: {
                ip_range: {
                    gte: '1.2.3.1',
                    lte: '1.2.3.254'
                }
            }
        },
        {
            type_config: {
                ip_range: 'ip_range'
            }
        }
    ],
    [
        'ip_range:"1.2.3.12"',
        'query.constant_score.filter',
        {
            range: {
                ip_range: {
                    gte: '1.2.3.12',
                    lte: '1.2.3.12'
                }
            }
        },
        {
            type_config: {
                ip_range: 'ip_range'
            }
        }
    ],
    [
        'ip_range:"2001:DB8::0/120"',
        'query.constant_score.filter',
        {
            range: {
                ip_range: {
                    gte: '2001:db8::1',
                    lte: '2001:db8::ff'
                }
            }
        },
        {
            type_config: {
                ip_range: 'ip_range'
            }
        }
    ],
    [
        'ip_range:"2001:DB8::64"',
        'query.constant_score.filter',
        {
            range: {
                ip_range: {
                    gte: '2001:db8::64',
                    lte: '2001:db8::64'
                }
            }
        },
        {
            type_config: {
                ip_range: 'ip_range'
            }
        }
    ]
] as TestCase[];
