import { TestCase } from './interfaces.js';

export default [
    [
        'can do basic geoDistance function call matches',
        'location:geoDistance(point:"33.435518,-111.873616" distance:5000m)',
        [{ location: '33.435967,-111.867710' }, { location: '22.435967,-150.867710' }],
        [true, false],
    ],
    [
        'can do geoBox function call matches',
        'location:geoBox(top_left:" 33.906320, -112.758421", bottom_right:"32.813646,-111.058902")',
        [{ location: '33.435967,  -111.867710 ' }, { location: '22.435967,-150.867710' }],
        [true, false],
    ],
    [
        'can do geoPolygon function call matches',
        'location: geoPolygon(points:["70.43,140.43", "81.3,123.4", "89.3,154.4"])',
        [{ location: '83.435967,144.867710' }, { location: '-22.435967,-150.867710' }],
        [true, false],
    ],
    [
        'geo fields do not throw with wrong data',
        'location:geoBox(top_left:" 33.906320,  -112.758421" bottom_right:"32.813646,-111.058902")',
        [
            { location: null },
            { location: { some: 'data' } },
            { location: [1234, 4234234, 223] },
            { location: 'asdop234' },
            { location: 1233.435967 },
            {},
        ],
        [false, false, false, false, false, false],
    ],
    [
        'can do basic matches with non string based geo points',
        'location:geoBox(top_left:" 33.906320,-112.758421" bottom_right:"32.813646,-111.058902")',
        [
            { location: { lat: '33.435967', lon: '-111.867710' } },
            { location: { latitude: '33.435967', longitude: '-111.867710' } },
            // Technically elasticsearch can take data3 as an array of numbers,
            // but we are ignoring that right now
            { location: ['33.435967, -111.867710'] },
            // this is a geoHash below
            { location: '9tbqnqu6tkj8' },
        ],
        [true, true, true, true],
    ],
    [
        'can do complicated matches',
        'location:geoBox(top_left:"33.906320,-112.758421" bottom_right:"32.813646,-111.058902") OR (some:/ke.*/ OR bytes:>=10000)',
        [
            { location: '33.435967,-111.867710', some: 'key', bytes: 123432 },
            { location: '22.435967,-150.867710', other: 'key', bytes: 123432 },
            { location: '22.435967,-150.867710', bytes: 100 },
        ],
        [true, true, false],
    ],
] as TestCase[];
