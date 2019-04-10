
export default [
    'can do basic regex matches'
    { key: 'abcde' },
    { key: 'field' },
    { key: 'abcdef' },
    { key: 'zabcde' },

   'key:/ab.*/');

   true,
   false,
   true,
   false,

   'key:/abcd/');

   false,
   false,
   false,
   false,
});

'can do more complex regex matches'
    { key: 'abbccc' },
    { key: 'field' },
    { key: 'abc' },
    { key: 'zabcde' },

   'key:/ab{2}c{3}/');

   true,
   false,
   false,
   false,

   'key:/ab*c*/');

   true,
   false,
   true,
   false,

   'key:/.*abcd?e?/');

   false,
   false,
   true,
   true,
});

'can do complex queries'
    { key: 'abcde', other: 'data2343' },
    { key: 'field' },
    { key: 'abcdef', bytes: 43 },
    { key: 'zabcde', other: 'something' },

   'key:/ab.*/ AND other:/data.*/');

   true,
   false,
   false,
   false,

   '_exists_:other OR (_created:["2018-04-02" TO "2018-10-19"] OR bytes:<200)', { _created: 'date' });

   true,
   false,
   true,
   true,
});
});
]
