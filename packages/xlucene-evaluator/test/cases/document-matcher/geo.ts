
export default [
    'can do basic matches'
    { location: '33.435967,-111.867710' },
    { location: '22.435967,-150.867710' },

   'location:(_geo_box_top_left_:"33.906320,-112.758421" _geo_box_bottom_right_:"32.813646,-111.058902")', { location: 'geo' });

   true,
   false,

   'location:(_geo_point_:"33.435518,-111.873616" _geo_distance_:5000m)', { location: 'geo' });

   true,
   false,
});

'can do basic matches with funky spaces'
    { location: '33.435967,  -111.867710 ' },
    { location: '22.435967,-150.867710' },

   'location:(_geo_box_top_left_:" 33.906320,  -112.758421" _geo_box_bottom_right_:"32.813646,-111.058902")', { location: 'geo' });

   true,
   false,

   'location:( _geo_point_:"33.435518,    -111.873616" _geo_distance_: 5000m   )', { location: 'geo' });

   true,
   false,
});

'geo fields do not throw with wrong data'
    { location: null },
    { location: { some: 'data' } },
    { location: [1234, 4234234, 223] },
    { location: 'asdop234' },
    { location: 1233.435967 },
    {},

   'location:(_geo_box_top_left_:" 33.906320,  -112.758421" _geo_box_bottom_right_:"32.813646,-111.058902")', { location: 'geo' });

   false,
   false,
   false,
   false,
   false,
   false,
});

'can do basic matches with non string based geo points'
    { location: { lat: '33.435967', lon: '-111.867710' } },
    { location: { latitude: '33.435967', longitude: '-111.867710' } },
   // Techincally elasticsearch can take data3 as an array of numbers, but we are ignoring that right now
    { location: ['33.435967, -111.867710'] },
   // this is a geohash below
    { location: '9tbqnqu6tkj8' },

   'location:(_geo_box_top_left_:" 33.906320,-112.758421" _geo_box_bottom_right_:"32.813646,-111.058902")', { location: 'geo' });

   true,
   true,
   true,
   true,
});

'can do complicated matches'
    { location: '33.435967,-111.867710', some: 'key', bytes: 123432 },
    { location: '22.435967,-150.867710', other: 'key', bytes: 123432 },
    { location: '22.435967,-150.867710', bytes: 100 },

   'location:(_geo_box_top_left_:"33.906320,-112.758421" _geo_box_bottom_right_:"32.813646,-111.058902") OR (some:/ke.*/ OR bytes:>=10000)', { location: 'geo' });

   true,
   true,
   false,
});
});
]
