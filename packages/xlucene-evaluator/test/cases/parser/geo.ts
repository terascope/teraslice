import { ASTType } from '../../../src/parser';
import { TestCase } from './interfaces';

export default [
    ['location:(_geo_point_:"33.435518,-111.873616" _geo_distance_:5000m)', 'a geo distance query with point first', {
        type: ASTType.GeoDistance,
        field: 'location',
        lat: 33.435518,
        lon: -111.873616,
        distance: 5000,
        unit: 'meters'
    }],
    ['location:(_geo_distance_:5000m _geo_point_:"33.435518,-111.873616")', 'a geo distance query with distance second', {
        type: ASTType.GeoDistance,
        field: 'location',
        lat: 33.435518,
        lon: -111.873616,
        distance: 5000,
        unit: 'meters'
    }],
    ['location:(_geo_box_top_left_:"33.906320,-112.758421" _geo_box_bottom_right_:"32.813646,-111.058902")', 'a geo point query top left and bottom right', {
        type: ASTType.GeoBoundingBox,
        field: 'location',
        top_left: {
            lat: 33.906320,
            lon: -112.758421
        },
        bottom_right: {
            lat: 32.813646,
            lon: -111.058902
        },
    }],
    ['location:(_geo_box_bottom_right_:"32.813646,-111.058902" _geo_box_top_left_:"33.906320,-112.758421")', 'a geo point query bottom right and top left', {
        type: ASTType.GeoBoundingBox,
        field: 'location',
        top_left: {
            lat: 33.906320,
            lon: -112.758421
        },
        bottom_right: {
            lat: 32.813646,
            lon: -111.058902
        },
    }],
] as TestCase[];
