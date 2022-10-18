import { TestCase } from './interfaces.js';

export default [
    [
        'ip_range:"1.2.3.0/24"',
        'query.constant_score.filter',
        {
            range: {
                ip_range: {
                    gte: '1.2.3.0',
                    lte: '1.2.3.255'
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
