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
] as TestCase[];
