
const ipRange = [
    { ipfield: '192.198.0.0' },
    { ipfield: '192.198.0.1' },
    { ipfield: '192.198.0.254' },
    { ipfield: '192.198.0.255' },
    { ipfield: '192.198.0.0/30' },
];

const compoundIpData = [
    { ipfield: '192.198.0.0/24', some: 'value' },
    { ipfield: '192.198.0.0/24', some: 'otherValue' },
    { ipfield: '192.198.0.1', some: 'value' },
    { ipfield: '192.198.0.1', key: 'value' },
    { ipfield: '127.0.0.1', key: 'value' },
    { ipfield: '127.0.0.1', some: 'value' },
    { ipfield: '1:2:3:4:5:6:7:8', duration: 120300 },
    { ipfield: '1:2:3:4:5:6:7:8', duration: 220300 },
];

const complexIpData = [
    { ipfield: '192.198.0.0/24', key: 'value', duration: 9263 },
    { ipfield: '192.198.0.0/24', key: 'otherValue', duration: 9263 },
    { ipfield: '192.198.0.1', some: 'value' },
    { ipfield: '192.198.0.1', key: 'value' },
    { ipfield: '192.198.0.1', key: 'value', duration: 123999 },
    { ipfield: '192.198.0.1', key: 'value', duration: 1234 },
    { ipfield: '192.198.0.0', key: 'value', duration: 1234000 },
    { ipfield: '127.0.0.1', key: 'value', duration: 1234 },
    { ipfield: '127.0.0.1', some: 'value', duration: 1234 },
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
        'can do ipv4 cidr range matches with type anotations',
        'ipfield:"192.198.0.0/24"',
        [
            { ipfield: '192.198.0.0/24' },
            { ipfield: '192.198.0.1' },
            { ipfield: '1:2:3:4:5:6:7:8' },
            { ipfield: 'fe80::/10' },
        ],
        [
            true,
            true,
            false,
            false,
        ],
        { ipfield: 'ip' }
    ],
    [
        'can do ipv6 cidr range matches with type anotations',
        'ipfield:"fe80::/10"',
        [
            { ipfield: '192.198.0.0/24' },
            { ipfield: '192.198.0.1' },
            { ipfield: '1:2:3:4:5:6:7:8' },
            { ipfield: 'fe80::/10' },
        ],
        [
            false,
            false,
            false,
            true,
        ],
        { ipfield: 'ip' }
    ],
    [
        'can do ipv6 matches with type anotations',
        'ipfield:1:2:3:4:5:6:7:8',
        [
            { ipfield: '192.198.0.0/24' },
            { ipfield: '192.198.0.1' },
            { ipfield: '1:2:3:4:5:6:7:8' },
            { ipfield: 'fe80::/10' },
        ],
        [
            false,
            false,
            true,
            false,
        ],
        { ipfield: 'ip' }
    ],
    [
        'can do ip type anotations with crazy data',
        'ipfield:"192.198.0.0/24"',
        [
            { ipfield: '123u0987324asdf' },
            { ipfield: null },
            { ipfield: { some: 'data' } },
            { ipfield: 12341234 },
            { ipfield: [{ other: 'things' }] },
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
        { ipfield: 'ip' }
    ],
    [
        'can support ip range modifiers []',
        'ipfield:[192.198.0.0 TO 192.198.0.255]',
        ipRange,
        [
            true,
            true,
            true,
            true,
            true,
        ],
        { ipfield: 'ip' }
    ],
    [
        'can support ip range modifiers {}',
        'ipfield:{192.198.0.0 TO 192.198.0.255}',
        ipRange,
        [
            false,
            true,
            true,
            false,
            true,
        ],
        { ipfield: 'ip' }
    ],
    [
        'can support ip range modifiers [}',
        'ipfield:[192.198.0.0 TO 192.198.0.255}',
        ipRange,
        [
            true,
            true,
            true,
            false,
            true,
        ],
        { ipfield: 'ip' }
    ],
    [
        'can support ip range modifiers {]',
        'ipfield:{192.198.0.0 TO 192.198.0.255]',
        ipRange,
        [
            false,
            true,
            true,
            true,
            true,
        ],
        { ipfield: 'ip' }
    ],
    [
        'can do compund logic AND with ip matches',
        'ipfield:"192.198.0.0/24" AND some:value',
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
        { ipfield: 'ip' }
    ],
    [
        'can do compund logic OR with ip matches',
        'ipfield:"192.198.0.0/24" OR some:value',
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
        { ipfield: 'ip' }
    ],
    [
        'can do compund logic _exists_ with ip matches',
        'ipfield:"192.198.0.0/24" AND _exists_:key',
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
        { ipfield: 'ip' }
    ],
    [
        'can do compund logic range with ip matches',
        'ipfield:"1:2:3:4:5:6:7:8" AND duration:>=200000',
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
        { ipfield: 'ip' }
    ],
    [
        'can do complex ip queries',
        'key:value AND (duration:<=10000 OR ipfield:{"192.198.0.0" TO "192.198.0.255"])',
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
        { ipfield: 'ip' }
    ],
    [
        'can do complex ip queries',
        'key:value AND (duration:(<=10000 AND >=343) OR ipfield:{"192.198.0.0" TO "192.198.0.255"])',
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
        { ipfield: 'ip' }
    ],
];
