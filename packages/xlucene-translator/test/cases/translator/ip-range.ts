import { TestCase } from './interfaces.js';

export default [
    // [
    //     'ip_range:"1.2.3.0/24"',
    //     'query.constant_score.filter',
    //     {
    //         range: {
    //             ip_range: {
    //                 gte: '1.2.3.0',
    //                 lte: '1.2.3.255'
    //             }
    //         }
    //     },
    //     {
    //         type_config: {
    //             ip_range: 'ip_range'
    //         }
    //     }
    // ],
    // [
    //     'ip_range:"1.2.3.12"',
    //     'query.constant_score.filter',
    //     {
    //         range: {
    //             ip_range: {
    //                 gte: '1.2.3.12',
    //                 lte: '1.2.3.12'
    //             }
    //         }
    //     },
    //     {
    //         type_config: {
    //             ip_range: 'ip_range'
    //         }
    //     }
    // ],
    // [
    //     'ip_range:"2001:DB8::0/120"',
    //     'query.constant_score.filter',
    //     {
    //         range: {
    //             ip_range: {
    //                 gte: '2001:db8::',
    //                 lte: '2001:db8::ff'
    //             }
    //         }
    //     },
    //     {
    //         type_config: {
    //             ip_range: 'ip_range'
    //         }
    //     }
    // ],
    // [
    //     'ip_range:"2001:DB8::64"',
    //     'query.constant_score.filter',
    //     {
    //         range: {
    //             ip_range: {
    //                 gte: '2001:db8::64',
    //                 lte: '2001:db8::64'
    //             }
    //         }
    //     },
    //     {
    //         type_config: {
    //             ip_range: 'ip_range'
    //         }
    //     }
    // ],
    [
        'ip_range:"0:0:0:0:0:FFFF/96"',
        'query.constant_score.filter',
        {
            range: {
                ip_range: {
                    gte: '::ffff:0:0:0',
                    lte: '::ffff:0:0:0'
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
        'ip_range:"::ffff:0:0:0/96"',
        'query.constant_score.filter',
        {
            range: {
                ip_range: {
                    gte: '::ffff:0:0:0',
                    lte: '::ffff:0:ffff:ffff'
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
