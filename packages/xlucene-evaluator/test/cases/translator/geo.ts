import { TestCase } from './interfaces';

export default [
    ['location:(_geo_box_top_left_:"34.5234,79.42345" _geo_box_bottom_right_:"54.5234,80.3456")', 'query.constant_score.filter', {
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
    }],
    ['loc:(_geo_point_:"33.435518,-111.873616" _geo_distance_:5000m)', 'query.constant_score.filter', {
        geo_distance: {
            distance: '5000meters',
            loc: {
                lat: 33.435518,
                lon: -111.873616,
            }
        }
    }],
] as TestCase[];
