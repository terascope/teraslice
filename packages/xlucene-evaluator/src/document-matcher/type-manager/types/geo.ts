import _ from 'lodash';
import pointInPolygon from '@turf/boolean-point-in-polygon';
// @ts-ignore
import createCircle from '@turf/circle';
import bbox from '@turf/bbox';
import bboxPolygon from '@turf/bbox-polygon';
import { lineString } from '@turf/helpers';
import BaseType from './base';
import { AST, GeoResults, BooleanCB } from '../../../interfaces';
import {
    isGeoNode,
    parseGeoDistance,
    parseGeoPoint
} from '../../../utils';

// TODO: allow ranges to be input and compare the two regions if they intersect
export default class GeoType extends BaseType {

    constructor() {
        super();
    }

    processAst(ast: AST): AST {

        function makeGeoQueryFn(geoResults: GeoResults): BooleanCB {
            const {
                geoBoxTopLeft,
                geoBoxBottomRight,
                geoPoint,
                geoDistance,
            } = geoResults;

            let polygon: any;

            if (geoBoxTopLeft != null && geoBoxBottomRight != null) {
                const pointTopLeft = parseGeoPoint(geoBoxTopLeft);
                const pointBottomRight = parseGeoPoint(geoBoxBottomRight);

                if (pointTopLeft != null && pointBottomRight != null) {
                    const line = lineString([
                        pointTopLeft,
                        pointBottomRight,
                    ]);

                    const box = bbox(line);
                    polygon = bboxPolygon(box);
                }
            }

            if (geoPoint && geoDistance) {
                const { distance, unit } = parseGeoDistance(geoDistance);
                const config = { units: unit };

                const parsedGeoPoint = parseGeoPoint(geoPoint);
                if (parsedGeoPoint != null) {
                    polygon = createCircle(
                        parsedGeoPoint,
                        distance,
                        config
                    );
                }
            }

            // Nothing matches so return false
            if (polygon == null) return () => false;
            return (fieldData: string): boolean => {
                const point = parseGeoPoint(fieldData, false);
                if (!point) return false;
                return pointInPolygon(point, polygon);
            };
        }

        const parseGeoAst = (node: AST, field:string) => {
            if (isGeoNode(node)) {
                const geoQueryParameters = { geoField: node.field };
                if (node.geo_point && node.geo_distance) {
                    geoQueryParameters['geoPoint'] = node.geo_point;
                    geoQueryParameters['geoDistance'] = node.geo_distance;
                }

                if (node.geo_box_top_left && node.geo_box_bottom_right) {
                    geoQueryParameters['geoBoxTopLeft'] = node.geo_box_top_left;
                    geoQueryParameters['geoBoxBottomRight'] = node.geo_box_bottom_right;
                }

                const geoFn: BooleanCB = makeGeoQueryFn(geoQueryParameters);
                return this.parseAST(node, geoFn, field);
            }
            return node;
        };

        return this.walkAst(ast, parseGeoAst);
    }
}
