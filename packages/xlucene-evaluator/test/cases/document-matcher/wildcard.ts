
export default [
    'can do basic wildcard matches'
    { key: 'abcde' },
    { key: 'field' },
    { key: 'abcdef' },
    { key: 'zabcde' },
    { key: 'hello abcde' },
    { key: 'abcde hello' },
    { key: 'abcccde' },

   'key:abc*');

   true,
   false,
   true,
   false,
   false,
   true,
   true,

   'key:abc??de');

   false,
   false,
   false,
   false,
   false,
   false,
   true,

   'key:?abc*');

   false,
   false,
   false,
   true,
   false,
   false,
   false,

   'key:*abc*');

   true,
   false,
   true,
   true,
   true,
   true,
   true,

   'key:abcd');

   false,
   false,
   false,
   false,
   false,
   false,
   false,
});

'can do more complex wildcard queries'
    { some: 'value', city: { key: 'abcde', field: 'other' } },
    { some: 'value', city: { key: 'abcde', field: 'other', nowIsTrue: 'something' } },
    { some: 'value', city: { key: 'abcde', deeper: { nowIsTrue: 'something' } } },
    { some: 'value', city: { key: 'abcde', deeper: { other: 'thing' } } },

   'city.*:something');

   false,
   true,
   false,

   'city.*:someth*');

   false,
   true,
   false,

   'city.deeper.*:someth*');

   false,
   false,
   true,

   'city.*.*:someth*');

   false,
   false,
   true,

   'city.*.*:(someth* OR thin?)');

   false,
   false,
   true,
   true,
});
]
