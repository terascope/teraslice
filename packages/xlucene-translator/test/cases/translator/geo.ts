import { TestCase } from './interfaces.js';

export default [
    [
        'location:geoBox(top_left:"10.5234,70.42345" bottom_right:"50.5234,60.3456")',
        '.',
        {
            query: {
                constant_score: {
                    filter: {
                        geo_bounding_box: {
                            location: {
                                top_left: {
                                    lat: 10.5234,
                                    lon: 70.42345,
                                },
                                bottom_right: {
                                    lat: 50.5234,
                                    lon: 60.3456
                                }
                            }
                        }
                    }
                }
            }
        },
        {},
        {
            geo_sort_order: 'desc',
            geo_sort_unit: 'feet'
        }
    ],
    [
        'location:geoPolygon(points:["70.43,140.43", "81.3,123.4", "85.3,134.4", "89.3,154.4"])',
        '.',
        {
            query: {
                constant_score: {
                    filter: {
                        bool: {
                            should: [
                                {
                                    bool: {
                                        filter: [
                                            {
                                                geo_polygon: {
                                                    location: {
                                                        points: [
                                                            [140.43, 70.43],
                                                            [123.4, 81.3],
                                                            [134.4, 85.3],
                                                            [154.4, 89.3],
                                                            [140.43, 70.43],
                                                        ]
                                                    }
                                                }
                                            },
                                            {
                                                bool: {
                                                    must_not: []
                                                }
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    }
                }
            }
        },
        {},
        {
            geo_sort_order: 'desc',
            geo_sort_unit: 'feet'
        }
    ],
    [
        'loc:geoDistance(point:"33.435518,-111.873616", distance:"5000in")',
        '.',
        {
            query: {
                constant_score: {
                    filter: {
                        geo_distance: {
                            distance: '5000inch',
                            loc: {
                                lat: 33.435518,
                                lon: -111.873616,
                            }
                        }
                    }
                }
            },
            sort: {
                _geo_distance: {
                    order: 'asc',
                    unit: 'inch',
                    loc: {
                        lat: 33.435518,
                        lon: -111.873616,
                    }
                }
            }
        },
        {
            default_geo_field: 'some_other_loc',
            default_geo_sort_unit: 'km'
        },
        {
            geo_sort_point: {
                lat: 35.435518,
                lon: -120.873616,
            },
            geo_sort_unit: 'nauticalmiles'
        }
    ],
    [
        'loc_a:geoDistance(point:"22.435518,-22.873616" distance:22NM) AND loc_b:geoDistance(point:"11.435518,-11.873616" distance:11cm)',
        '.',
        {
            query: {
                constant_score: {
                    filter: {
                        bool: {
                            should: [
                                {
                                    bool: {
                                        filter: [
                                            {
                                                geo_distance: {
                                                    distance: '22nauticalmiles',
                                                    loc_a: {
                                                        lat: 22.435518,
                                                        lon: -22.873616,
                                                    }
                                                }
                                            },
                                            {
                                                geo_distance: {
                                                    distance: '11centimeters',
                                                    loc_b: {
                                                        lat: 11.435518,
                                                        lon: -11.873616,
                                                    }
                                                }
                                            },
                                        ],
                                    },
                                },
                            ]
                        },
                    }
                }
            },
            sort: [
                {
                    _geo_distance: {
                        order: 'asc',
                        unit: 'nauticalmiles',
                        loc_a: {
                            lat: 22.435518,
                            lon: -22.873616,
                        }
                    }
                },
                {
                    _geo_distance: {
                        order: 'asc',
                        unit: 'centimeters',
                        loc_b: {
                            lat: 11.435518,
                            lon: -11.873616,
                        }
                    }
                },
            ]
        }
    ],
] as TestCase[];
