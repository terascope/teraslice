
import _ from 'lodash';
import pointInPolygon from '@turf/boolean-point-in-polygon';
import createCircle from '@turf/circle';
import bbox from '@turf/bbox';
import bboxPolygon from '@turf/bbox-polygon';
import { lineString } from '@turf/helpers';
// @ts-ignore TODO: we should add types
import geoHash from 'latlon-geohash';
import BaseType from './base';
import { bindThis } from '../../../utils';
import { AST, GeoResults, GeoDistance, GeoPoint } from '../../../interfaces';

// feet
const MileUnits = {
    mi: 'miles',
    miles: 'miles',
    mile: 'miles',
};
const NMileUnits = {
    NM:'nauticalmiles',
    nmi: 'nauticalmiles',
    nauticalmile: 'nauticalmiles',
    nauticalmiles: 'nauticalmiles'
};
const inchUnits = {
    in: 'inches',
    inch: 'inches',
    inches: 'inches'
};
const yardUnits = {
    yd: 'yards',
    yard: 'yards',
    yards: 'yards'
};
const meterUnits = {
    m: 'meters',
    meter: 'meters',
    meters: 'meters'
};
const kilometerUnits = {
    km: 'kilometers',
    kilometer: 'kilometers',
    kilometers: 'kilometers'
};
const millimeterUnits = {
    mm: 'millimeters',
    millimeter: 'millimeters',
    millimeters: 'millimeters'
};
const centimetersUnits = {
    cm: 'centimeters',
    centimeter: 'centimeters',
    centimeters: 'centimeters'
};
const feetUnits = {
    ft: 'feet',
    feet: 'feet'
};

const UNIT_DICTONARY = Object.assign({}, MileUnits, NMileUnits, inchUnits, yardUnits, meterUnits, kilometerUnits, millimeterUnits, centimetersUnits, feetUnits);

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

        function getLonAndLat(input: any, isInit?: boolean): [number, number] {
            const lat = input.lat || input.latitude;
            const lon = input.lon || input.longitude;
            if (isInit && (!lat || !lon)) throw new Error('geopoint must contain keys lat,lon or latitude/longitude');

            return [_.toNumber(lat), _.toNumber(lon)];
        }

        function parsePoint(point: GeoPoint | number[] | object, isInit?: boolean): number[] | null {
            let results = null;

            if (typeof point === 'string') {
                if (point.match(',')) {
                    results = point.split(',').map(st => st.trim()).map(numStr => Number(numStr));
                } else {
                    try {
                        results = _.values(geoHash.decode(point));
                    } catch (err) {}
                }
            }

            if (Array.isArray(point)) results = point.map(_.toNumber);

            if (_.isPlainObject(point)) {
                results = getLonAndLat(point, isInit);
            }

            if (isInit && !results) throw new Error(`incorrect point given to parse, point:${point}`);

            // data incoming is lat,lon and we must return lon,lat
            if (results) return results.reverse();
            return results;
        }

        function parseDistance(str: string): GeoDistance {
            const trimed = str.trim();
            const matches = trimed.match(/(\d+)(.*)$/);
            if (!matches) throw new Error(`Incorrect geo distance parameter provided: ${str}`);

            const distance = Number(matches[1]);
            const unit = UNIT_DICTONARY[matches[2]];
            if (!unit) throw new Error(`incorrect distance unit provided: ${matches[2]}`);
            return { distance, unit };
        }

        function makeGeoQueryFn(geoResults: GeoResults): Function {
            const {
                geoBoxTopLeft,
                geoBoxBottomRight,
                geoPoint,
                geoDistance,
            } = geoResults;

            let polygon: any;
            const initSetup = true;

            if (geoBoxTopLeft != null && geoBoxBottomRight != null) {
                const line = lineString([
                    // @ts-ignore TODO this can return null we should handle that case
                    parsePoint(geoBoxTopLeft, initSetup),
                    // @ts-ignore TODO this can return null we should handle that case
                    parsePoint(geoBoxBottomRight, initSetup)
                ]);

                const box = bbox(line);
                polygon = bboxPolygon(box);
            }

            if (geoPoint && geoDistance) {
                const { distance, unit } = parseDistance(geoDistance);
                const config = { units: unit };
                polygon =  createCircle(
                    // @ts-ignore TODO this can return null we should handle that case
                    parsePoint(geoPoint, initSetup),
                    distance,
                    config
                );
            }

            // Nothing matches so return false
            if (polygon === undefined) return (): boolean => false;
            return (fieldData: string): Boolean => {
                const point = parsePoint(fieldData);
                if (!point) return false;
                return pointInPolygon(point, polygon);
            };
        }

        function parseGeoAst(node: AST, _field:string): AST {
            if (node.type === 'geo') {
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
                return { field: '__parsed', term: createParsedField(node.field) };
            }
            return node;
        }

        return this.walkAst(ast, parseGeoAst);
    }
}
