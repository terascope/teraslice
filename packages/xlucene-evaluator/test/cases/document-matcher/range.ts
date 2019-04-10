
export default [

    'can handle "< > <= >="'
    const data = { age: 33 },
     { age: 8 },
     { age: 8100 },
     { other: 33 },
     { age: 10 },

    'age:>0');

    expect(documentMatcher.match(data)).toEqual(true,
    true,
    true,
    false,
    true,

    'age:>10');

    expect(documentMatcher.match(data)).toEqual(true,
    false,
    true,
    false,
    false,

    'age:<10');

    expect(documentMatcher.match(data)).toEqual(false,
    true,
    false,
    false,
    false,

    'age:>=10');

    expect(documentMatcher.match(data)).toEqual(true,
    false,
    true,
    false,
    true,

    'age:<=10');

    expect(documentMatcher.match(data)).toEqual(false,
    true,
    false,
    false,
    true,
});

'can handle complex range "()" operators'
     { age: 8 },
     { age: 10 },
     { age: 15 },
     { age: 20 },
     { age: 50 },
     { age: 100 },

    'age:(>10 AND <20)');

    false,
    false,
    true,
    false,
    false,
    false,

    'age:(>=10 AND <20)');

    false,
    true,
    true,
    false,
    false,
    false,

    'age:(>10 AND <=20)');

    false,
    false,
    true,
    true,
    false,
    false,

    'age:(>=10 AND <=20)');

    false,
    true,
    true,
    true,
    false,
    false,

    'age:((>=10 AND <=20) OR >=100)');

    false,
    true,
    true,
    true,
    false,
    true,
});

'can handle nested values'
     { person: { age: 8 } },
     { person: { age: 10 } },
     { person: { age: 15 } },
     { person: { age: 20 } },
     { person: { age: 50 } },
     { person: { age: 100 } },

    'person.age:[0 TO *]');

    true,
    true,
    true,
    true,
    true,
    true,
});

'can handle bad values'
     {},
     { person: 'asdfasdf' },
     [123, 4234];
     { person: null },
     { person: ['asdf'] },
     { other: { age: 100 } },

    'person.age:[0 TO *]');

    false,
    false,
    false,
    false,
    false,
    false,
});

'can handle elasticsearch range queries ([],{},[}, {])'
     { age: 8 },
     { age: 10 },
     { age: 15 },
     { age: 20 },
     { age: 50 },
     { age: 100 },

    'age:[0 TO *]');

    true,
    true,
    true,
    true,
    true,
    true,

    'age:[10 TO 20]');

    false,
    true,
    true,
    true,
    false,
    false,

    'age:{10 TO 20]');

    false,
    false,
    true,
    true,
    false,
    false,

    'age:[10 TO 20}');

    false,
    true,
    true,
    false,
    false,
    false,

    'age:{10 TO 20}');

    false,
    false,
    true,
    false,
    false,
    false,

    'age:{10 TO *}');

    false,
    false,
    true,
    true,
    true,
    true,

    'age:([10 TO 20] OR >=100)');

    false,
    true,
    true,
    true,
    false,
    true,

    // swithcing directions of last test to check grammar
    'age:(>=100 OR [10 TO 20])');

    false,
    true,
    true,
    true,
    false,
    true,
});
});

];
