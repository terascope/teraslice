import { xLuceneFieldType } from '@terascope/types';
import { TestCase } from './interfaces';

const ipRange = [
    { ipField: '192.198.0.0' },
    { ipField: '192.198.0.1' },
    { ipField: '192.198.0.254' },
    { ipField: '192.198.0.255' },
    { ipField: '192.198.0.0/30' },
];

const compoundIpData = [
    { ipField: '192.198.0.0/24', some: 'value' },
    { ipField: '192.198.0.0/24', some: 'otherValue' },
    { ipField: '192.198.0.1', some: 'value' },
    { ipField: '192.198.0.1', key: 'value' },
    { ipField: '127.0.0.1', key: 'value' },
    { ipField: '127.0.0.1', some: 'value' },
    { ipField: '1:2:3:4:5:6:7:8', duration: 120300 },
    { ipField: '1:2:3:4:5:6:7:8', duration: 220300 },
];

const complexIpData = [
    { ipField: '192.198.0.0/24', key: 'value', duration: 9263 },
    { ipField: '192.198.0.0/24', key: 'otherValue', duration: 9263 },
    { ipField: '192.198.0.1', some: 'value' },
    { ipField: '192.198.0.1', key: 'value' },
    { ipField: '192.198.0.1', key: 'value', duration: 123999 },
    { ipField: '192.198.0.1', key: 'value', duration: 1234 },
    { ipField: '192.198.0.0', key: 'value', duration: 1234000 },
    { ipField: '127.0.0.1', key: 'value', duration: 1234 },
    { ipField: '127.0.0.1', some: 'value', duration: 1234 },
];

export default [
    [
        'can do exact matches, no type changes',
        'ip:157.60.0.1',
        [
            { ip: '157.60.0.1' },
            { ip: '1:2:3:4:5:6:7:8' },
            { ip: 'fe80::/10' },
        ],
        [
            true,
            false,
            false,
        ],
    ],
    [
        'can do exact matches, no type changes',
        'ip:1:2:3:4:5:6:7:8',
        [
            { ip: '157.60.0.1' },
            { ip: '1:2:3:4:5:6:7:8' },
            { ip: 'fe80::/10' },
        ],
        [
            false,
            true,
            false,
        ],
    ],
    [
        'can do exact matches, no type changes',
        'ip:"fe80::/10"',
        [
            { ip: '157.60.0.1' },
            { ip: '1:2:3:4:5:6:7:8' },
            { ip: 'fe80::/10' },
        ],
        [
            false,
            false,
            true,
        ],
    ],
    [
        'can do ipv4 cidr range matches with type annotations',
        'ipField:"192.198.0.0/24"',
        [
            { ipField: '192.198.0.0/24' },
            { ipField: '192.198.0.1' },
            { ipField: '1:2:3:4:5:6:7:8' },
            { ipField: 'fe80::/10' },
        ],
        [
            true,
            true,
            false,
            false,
        ],
        { ipField: xLuceneFieldType.IP }
    ],
    [
        'can do ipv6 cidr range matches with type annotations',
        'ipField:"fe80::/10"',
        [
            { ipField: '192.198.0.0/24' },
            { ipField: '192.198.0.1' },
            { ipField: '1:2:3:4:5:6:7:8' },
            { ipField: 'fe80::/10' },
        ],
        [
            false,
            false,
            false,
            true,
        ],
        { ipField: xLuceneFieldType.IP }
    ],
    [
        'can do ipv6 matches with type annotations',
        'ipField:1:2:3:4:5:6:7:8',
        [
            { ipField: '192.198.0.0/24' },
            { ipField: '192.198.0.1' },
            { ipField: '1:2:3:4:5:6:7:8' },
            { ipField: 'fe80::/10' },
        ],
        [
            false,
            false,
            true,
            false,
        ],
        { ipField: xLuceneFieldType.IP }
    ],
    [
        'can match ranges with type IP',
        'ipField:"192.198.0.0/24"',
        [
            { ipField: '192.198.0.0/24' },
            { ipField: '192.198.0.1' },
            { ipField: '1:2:3:4:5:6:7:8' },
            { ipField: 'fe80::/10' },
        ],
        [
            true,
            true,
            false,
            false,
        ],
        { ipField: xLuceneFieldType.IP }
    ],
    [
        'can match ranges with type IPRange',
        'ipField:"192.198.0.0/24"',
        [
            { ipField: '192.198.0.0/24' },
            { ipField: '192.198.0.1' },
            { ipField: '1:2:3:4:5:6:7:8' },
            { ipField: 'fe80::/10' },
        ],
        [
            true,
            true,
            false,
            false,
        ],
        { ipField: xLuceneFieldType.IPRange }
    ],
    [
        'can do ip type annotations with crazy data',
        'ipField:"192.198.0.0/24"',
        [
            { ipField: '123u0987324asdf' },
            { ipField: null },
            { ipField: { some: 'data' } },
            { ipField: 12341234 },
            { ipField: [{ other: 'things' }] },
            {},
        ],
        [
            false,
            false,
            false,
            false,
            false,
            false,
        ],
        { ipField: xLuceneFieldType.IP }
    ],
    [
        'can support ip range modifiers []',
        'ipField:[192.198.0.0 TO 192.198.0.255]',
        ipRange,
        [
            true,
            true,
            true,
            true,
            true,
        ],
        { ipField: xLuceneFieldType.IP }
    ],
    [
        'can support ip range modifiers {}',
        'ipField:{192.198.0.0 TO 192.198.0.255}',
        ipRange,
        [
            false,
            true,
            true,
            false,
            true,
        ],
        { ipField: xLuceneFieldType.IP }
    ],
    [
        'can support ip range modifiers [}',
        'ipField:[192.198.0.0 TO 192.198.0.255}',
        ipRange,
        [
            true,
            true,
            true,
            false,
            true,
        ],
        { ipField: xLuceneFieldType.IP }
    ],
    [
        'can support ip range modifiers {]',
        'ipField:{192.198.0.0 TO 192.198.0.255]',
        ipRange,
        [
            false,
            true,
            true,
            true,
            true,
        ],
        { ipField: xLuceneFieldType.IP }
    ],
    [
        'can do compound logic AND with ip matches',
        'ipField:"192.198.0.0/24" AND some:value',
        compoundIpData,
        [
            true,
            false,
            true,
            false,
            false,
            false,
            false,
            false,
        ],
        { ipField: xLuceneFieldType.IP }
    ],
    [
        'can do compound logic OR with ip matches',
        'ipField:"192.198.0.0/24" OR some:value',
        compoundIpData,
        [
            true,
            true,
            true,
            true,
            false,
            true,
            false,
            false,
        ],
        { ipField: xLuceneFieldType.IP }
    ],
    [
        'can do compound logic _exists_ with ip matches',
        'ipField:"192.198.0.0/24" AND _exists_:key',
        compoundIpData,
        [
            false,
            false,
            false,
            true,
            false,
            false,
            false,
            false,
        ],
        { ipField: xLuceneFieldType.IP }
    ],
    [
        'can do compound logic range with ip matches',
        'ipField:"1:2:3:4:5:6:7:8" AND duration:>=200000',
        compoundIpData,
        [
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            true,
        ],
        { ipField: xLuceneFieldType.IP }
    ],
    [
        'can do complex ip queries',
        'key:value AND (duration:<=10000 OR ipField:{"192.198.0.0" TO "192.198.0.255"])',
        complexIpData,
        [
            true,
            false,
            false,
            true,
            true,
            true,
            false,
            true,
            false,
        ],
        { ipField: xLuceneFieldType.IP }
    ],
    [
        'can do complex ip queries',
        'key:value AND (duration:(<=10000 AND >=343) OR ipField:{"192.198.0.0" TO "192.198.0.255"])',
        complexIpData,
        [
            true,
            false,
            false,
            true,
            true,
            true,
            false,
            true,
            false,
        ],
        { ipField: xLuceneFieldType.IP }
    ],
] as TestCase[];
