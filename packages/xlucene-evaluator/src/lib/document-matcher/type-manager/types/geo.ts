
import _ from 'lodash';
import pointInPolygon from '@turf/boolean-point-in-polygon';
import createCircle from '@turf/circle';
import bbox from '@turf/bbox';
import bboxPolygon from '@turf/bbox-polygon';
import { lineString, Units, } from '@turf/helpers';
import BaseType from './base';
import { bindThis, ast } from '../../../utils';
import geoHash from 'latlon-geohash';

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

const geoParameters = {
    _geo_point_: 'geoPoint',
    _geo_distance_: 'geoDistance',
    _geo_box_top_left_: 'geoBoxTopLeft',
    _geo_box_bottom_right_: 'geoBoxBottomRight',
};

const fnBaseName = 'geoFn';

interface geoResults{
    geoField: string;
    geoBoxTopLeft?: string;
    geoBoxBottomRight?: string;
    geoPoint?: string;
    geoDistance?: string;
}

interface geoDistance {
    distance: number;
    unit: Units;
}

type geoPointArr = [number, number];
type geoPointStr = string;
type geoObjShort = {lat: string | number, lon: string | number};
type geoObjLong = {latitude: string | number, longitude: string | number};
type geoPoint = geoPointArr | geoPointStr | geoObjShort | geoObjLong


//TODO: allow ranges to be input and compare the two regions if they intersect

export default class GeoType extends BaseType {
    private fields: object;

    constructor(geoFieldDict: object) {
        super(fnBaseName);
        this.fields = geoFieldDict;
        bindThis(this, GeoType);
    }

    processAst(ast: ast): ast {
        const { walkAst, filterFnBuilder, createParsedField, fields } = this;
        
        function parsePoint(point: geoPoint | number[] | object): number[] {
            let results = null;

            if (typeof point === 'string') {
                if (point.match(',')) {
                    results = point.split(',').map(st => st.trim()).map(numStr => Number(numStr));
                } else {
                    results = _.values(geoHash.decode(point));
                }
            }

            if (Array.isArray(point)) results = point.map(_.toNumber);

            if (_.isPlainObject(point)) {
                const lat = _.get(point, 'lat') || _.get(point, 'latitude');
                const lon = _.get(point, 'lon') || _.get(point, 'longitude');

                if (!lat || !lon) throw new Error('geopoint must contain keys lat,lon or latitude/longitude');
                results = [lat, lon].map(_.toNumber)
            }

            if (!results) throw new Error(`incorrect point given to parse, point:${point}`)

            // data incoming is lat,lon and we must return lon,lat
            return results.reverse();
        }
        function parseDistance(str: string): geoDistance {
            const trimed = str.trim();
            const matches = trimed.match(/(\d+)(.*)$/);
            if (!matches) throw new Error(`Incorrect geo distance parameter provided: ${str}`)
    
            const distance = Number(matches[1]);
            const unit = UNIT_DICTONARY[matches[2]];
            if (!unit) throw new Error(`incorrect distance unit provided: ${matches[2]}`)
            return { distance, unit };
        }

        function makeGeoQueryFn(geoResults: geoResults): Function {
            const {
                geoBoxTopLeft,
                geoBoxBottomRight,
                geoPoint,
                geoDistance,
            } = geoResults;

            let polygon: any;

            if (geoBoxTopLeft && geoBoxBottomRight) {
                const line = lineString([parsePoint(geoBoxTopLeft), parsePoint(geoBoxBottomRight)]);
                const box = bbox(line);
                polygon = bboxPolygon(box);
            }

            if (geoPoint && geoDistance) {
                const { distance, unit } = parseDistance(geoDistance);
                const config = { units: unit };
                polygon =  createCircle(parsePoint(geoPoint), distance, config);
            }

            // Nothing matches so return false
            if (polygon === undefined) return (): boolean => false;
            return (fieldData: string): Boolean => {
                const point = parsePoint(fieldData);
                return pointInPolygon(point, polygon);
            };
        }

        function parseGeoAst(node: ast, _field:string): ast {
            const topField = node.field || _field;

            if (topField && fields[topField]) {
                const geoQueryParameters = { geoField: topField };
                function gatherGeoQueries(node: ast) {
                    const field = node.field;
                    if (field && geoParameters[field]) {
                        geoQueryParameters[geoParameters[field]] = node.term;
                    }
                    return node;
                }
                walkAst(node, gatherGeoQueries);
                filterFnBuilder(makeGeoQueryFn(geoQueryParameters));
                return { field: '__parsed', term: createParsedField(topField) };
            }
            return node;
        }

        return this.walkAst(ast, parseGeoAst);
    }
}
