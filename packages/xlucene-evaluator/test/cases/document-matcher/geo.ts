
export default [
    [
        'can do basic boundingbox matches',
        'location:(_geo_box_top_left_:"33.906320,-112.758421" _geo_box_bottom_right_:"32.813646,-111.058902")',
        [
            { location: '33.435967,-111.867710' },
            { location: '22.435967,-150.867710' },
        ],
        [
            true,
            false,
        ],
        { location: 'geo' }
    ],
    [
        'can do basic geodistance matches',
        'location:(_geo_point_:"33.435518,-111.873616" _geo_distance_:5000m)',
        [
            { location: '33.435967,-111.867710' },
            { location: '22.435967,-150.867710' },
        ],
        [
            true,
            false,
        ],
        { location: 'geo' }
    ],
    [
        'can do basic matches with funky spaces in geopoints in a boundingbox query',
        'location:(_geo_box_top_left_:" 33.906320,  -112.758421" _geo_box_bottom_right_:"32.813646,-111.058902")',
        [
            { location: '33.435967,  -111.867710 ' },
            { location: '22.435967,-150.867710' },
        ],
        [
            true,
            false,
        ],
        { location: 'geo' }
    ],
    [
        'can do basic matches with funky spaces in geopoints in a geodistance query',
        'location:( _geo_point_:"33.435518,    -111.873616" _geo_distance_: 5000m   )',
        [
            { location: '33.435967,  -111.867710 ' },
            { location: '22.435967,-150.867710' },
        ],
        [
            true,
            false,
        ],
        { location: 'geo' }
    ],
    [
        'geo fields do not throw with wrong data',
        'location:(_geo_box_top_left_:" 33.906320,  -112.758421" _geo_box_bottom_right_:"32.813646,-111.058902")',
        [
            { location: null },
            { location: { some: 'data' } },
            { location: [1234, 4234234, 223] },
            { location: 'asdop234' },
            { location: 1233.435967 },
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
        { location: 'geo' }
    ],
    [
        'can do basic matches with non string based geo points',
        'location:(_geo_box_top_left_:" 33.906320,-112.758421" _geo_box_bottom_right_:"32.813646,-111.058902")',
        [
            { location: { lat: '33.435967', lon: '-111.867710' } },
            { location: { latitude: '33.435967', longitude: '-111.867710' } },
            // Techincally elasticsearch can take data3 as an array of numbers, but we are ignoring that right now
            { location: ['33.435967, -111.867710'] },
            // this is a geohash below
            { location: '9tbqnqu6tkj8' },
        ],
        [
            true,
            true,
            true,
            true,
        ],
        { location: 'geo' }
    ],
    [
        'can do complicated matches',
        'location:(_geo_box_top_left_:"33.906320,-112.758421" _geo_box_bottom_right_:"32.813646,-111.058902") OR (some:/ke.*/ OR bytes:>=10000)',
        [
            { location: '33.435967,-111.867710', some: 'key', bytes: 123432 },
            { location: '22.435967,-150.867710', other: 'key', bytes: 123432 },
            { location: '22.435967,-150.867710', bytes: 100 },
        ],
        [
            true,
            true,
            false,
        ],
        { location: 'geo' }
    ],
];
