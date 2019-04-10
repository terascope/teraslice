
export default [
    'can do exact matches, no type changes'
    { ip: '157.60.0.1' },
    { ip: '1:2:3:4:5:6:7:8' },
    { ip: 'fe80::/10' },

   'ip:157.60.0.1');

   true,
   false,
   false,

   'ip:1:2:3:4:5:6:7:8');

   false,
   true,
   false,

   'ip:"fe80::/10"');

   false,
   false,
   true,
});

'can do cidr range matches with type anotations'
    { ipfield: '192.198.0.0/24' },
    { ipfield: '192.198.0.1' },
    { ipfield: '1:2:3:4:5:6:7:8' },
    { ipfield: 'fe80::/10' },

   'ipfield:"192.198.0.0/24"', { ipfield: 'ip' });

   true,
   true,
   false,
   false,

   // TODO: test cidrs that intersect from both ways

   'ipfield:1:2:3:4:5:6:7:8', { ipfield: 'ip' });

   false,
   false,
   true,
   false,

   'ipfield:"fe80::/10"', { ipfield: 'ip' });

   false,
   false,
   false,
   true,
});

'can do ip type anotations with crazy data'
    { ipfield: '123u0987324asdf' },
    { ipfield: null },
    { ipfield: { some: 'data' } },
    { ipfield: 12341234 },
    { ipfield: [{ other: 'things' }] },
    {},

   'ipfield:"192.198.0.0/24"', { ipfield: 'ip' });

   false,
   false,
   false,
   false,
   false,
   false,
});

'can support ip range modifiers [], {}, [}'
    { ipfield: '192.198.0.0' },
    { ipfield: '192.198.0.1' },
    { ipfield: '192.198.0.254' },
    { ipfield: '192.198.0.255' },
    { ipfield: '192.198.0.0/30' },

   'ipfield:[192.198.0.0 TO 192.198.0.255]', { ipfield: 'ip' });

   true,
   true,
   true,
   true,
   true,

   'ipfield:{192.198.0.0 TO 192.198.0.255}', { ipfield: 'ip' });

   false,
   true,
   true,
   false,
   true,

   'ipfield:[192.198.0.0 TO 192.198.0.255}', { ipfield: 'ip' });

   true,
   true,
   true,
   false,
   true,

   'ipfield:{192.198.0.0 TO 192.198.0.255]', { ipfield: 'ip' });

   false,
   true,
   true,
   true,
   true,
});

'can do AND OR ip matches'
    { ipfield: '192.198.0.0/24', some: 'value' },
    { ipfield: '192.198.0.0/24', some: 'otherValue' },
    { ipfield: '192.198.0.1', some: 'value' },
    { ipfield: '192.198.0.1', key: 'value' },
    { ipfield: '127.0.0.1', key: 'value' },
    { ipfield: '127.0.0.1', some: 'value' },

    { ipfield: '1:2:3:4:5:6:7:8', duration: 120300 },
   const data8 = { ipfield: '1:2:3:4:5:6:7:8', duration: 220300 },

   'ipfield:"192.198.0.0/24" AND some:value', { ipfield: 'ip' });

   true,
   false,
   true,
   false,
   false,
   false,
   false,
   false,

   'ipfield:"192.198.0.0/24" OR key:value', { ipfield: 'ip' });

   true,
   true,
   true,
   true,
   true,
   false,
   false,
   false,

   'ipfield:"192.198.0.0/24" AND _exists_:key', { ipfield: 'ip' });

   false,
   false,
   false,
   true,
   false,
   false,
   false,
   false,

   'ipfield:"1:2:3:4:5:6:7:8" AND duration:>=200000', { ipfield: 'ip' });

   false,
   false,
   false,
   false,
   false,
   false,
   false,
   true,
});

'can do complex ip queries'
    { ipfield: '192.198.0.0/24', key: 'value', duration: 9263 },
    { ipfield: '192.198.0.0/24', key: 'otherValue', duration: 9263 },
    { ipfield: '192.198.0.1', some: 'value' },
    { ipfield: '192.198.0.1', key: 'value' },
    { ipfield: '192.198.0.1', key: 'value', duration: 123999 },
    { ipfield: '192.198.0.1', key: 'value', duration: 1234 },
    { ipfield: '192.198.0.0', key: 'value', duration: 1234000 },

   const data8 = { ipfield: '127.0.0.1', key: 'value', duration: 1234 },
   const data9 = { ipfield: '127.0.0.1', some: 'value', duration: 1234 },

   'key:value AND (duration:<=10000 OR ipfield:{"192.198.0.0" TO "192.198.0.255"])', { ipfield: 'ip' });

   true,
   false,
   false,
   true,
   true,
   true,
   false,
   true,
   false,

   'key:value AND (duration:(<=10000 AND >=343) OR ipfield:{"192.198.0.0" TO "192.198.0.255"])', { ipfield: 'ip' });

   true,
   false,
   false,
   true,
   true,
   true,
   false,
   true,
   false,
});
});
]
