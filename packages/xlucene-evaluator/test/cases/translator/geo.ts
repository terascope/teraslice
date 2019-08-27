import { TestCase } from './interfaces';

export default [
    [
        'location:(_geo_box_top_left_:"34.5234,79.42345" _geo_box_bottom_right_:"54.5234,80.3456")',
        '.',
        {
            query: {
                constant_score: {
                    filter: {
                        geo_bounding_box: {
                            location: {
                                top_left: {
                                    lat: 34.5234,
                                    lon: 79.42345,
                                },
                                bottom_right: {
                                    lat: 54.5234,
                                    lon: 80.3456
                                }
                            }
                        }
                    }
                }
            },
            sort: {
                _geo_distance: {
                    order: 'desc',
                    unit: 'feet',
                    default_loc: {
                        lat: 32.335518,
                        lon: -110.773616,
                    }
                }
            }
        },
        {
            default_geo_field: 'default_loc',
            default_geo_sort_unit: 'km'
        },
        {
            geo_sort_point: {
                lat: 32.335518,
                lon: -110.773616
            },
            geo_sort_order: 'desc',
            geo_sort_unit: 'feet'
        }
    ],
    [
        'location:(_geo_box_top_left_:"10.5234,70.42345" _geo_box_bottom_right_:"50.5234,60.3456")',
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
        'loc:(_geo_point_:"33.435518,-111.873616" _geo_distance_:5000in)',
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
        'loc_a:(_geo_point_:"22.435518,-22.873616" _geo_distance_:22NM) AND loc_b:(_geo_point_:"11.435518,-11.873616" _geo_distance_:11cm)',
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
