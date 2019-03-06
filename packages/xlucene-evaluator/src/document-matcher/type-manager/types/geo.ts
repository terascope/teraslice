import _ from 'lodash';
import pointInPolygon from '@turf/boolean-point-in-polygon';
// @ts-ignore
import createCircle from '@turf/circle';
import bbox from '@turf/bbox';
import bboxPolygon from '@turf/bbox-polygon';
import { lineString } from '@turf/helpers';
import BaseType from './base';
import { AST, GeoResults } from '../../../interfaces';
import {
    bindThis,
    isGeoNode,
    parseGeoDistance,
    parseGeoPoint
} from '../../../utils';

const fnBaseName = 'geoFn';

// TODO: allow ranges to be input and compare the two regions if they intersect
export default class GeoType extends BaseType {

    constructor() {
        super(fnBaseName);
        bindThis(this, GeoType);
    }

    processAst(ast: AST): AST {
        // tslint:disable-next-line no-this-assignment
        const { filterFnBuilder, createParsedField } = this;

        function makeGeoQueryFn(geoResults: GeoResults): Function {
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
            if (polygon == null) return (): boolean => false;
            return (fieldData: string): Boolean => {
                const point = parseGeoPoint(fieldData, false);
                if (!point) return false;
                return pointInPolygon(point, polygon);
            };
        }

        function parseGeoAst(node: AST, _field:string) {
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

                filterFnBuilder(makeGeoQueryFn(geoQueryParameters));

                return {
                    type: 'term',
                    field: '__parsed',
                    term: createParsedField(node.field)
                };
            }
            return node;
        }

        return this.walkAst(ast, parseGeoAst);
    }
}
