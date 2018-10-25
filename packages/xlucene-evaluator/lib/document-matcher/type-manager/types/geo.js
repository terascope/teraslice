'use strict';

const pointInPolygon = require('@turf/boolean-point-in-polygon');
const createCircle = require('@turf/circle');
const bbox = require('@turf/bbox').default;
const bboxPolygon = require('@turf/bbox-polygon');
const { lineString } = require('@turf/helpers');
const BaseType = require('./base');
const { bindThis } = require('../../../utils');


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

//TODO: is geo_sort_unit correct name for units?
const geoParameters = {
    _geo_point_: 'geoPoint',
    _geo_distance_: 'geoDistance',
    _geo_box_top_left_: 'geoBoxTopLeft',
    _geo_box_bottom_right_: 'geoBoxBottomRight',
    _geo_sort_unit_: 'geoSortUnit'
};

const fnBaseName = 'geoFn';


class GeoType extends BaseType {
    constructor(geoFieldDict) {
        super(fnBaseName);
        this.fields = geoFieldDict;
        this.geoResults = {};
        bindThis(this, GeoType);
    }

    processAst(ast) {
        const { walkAst, filterFnBuilder, createParsedField, fields } = this;

        function parsePoint(str) {
            return str.split(',').map(st => st.trim()).map(numStr => Number(numStr)).reverse();
        }

        function makeGeoQueryFn(geoResults) {
            const {
                geoField,
                geoBoxTopLeft,
                geoBoxBottomRight,
                geoPoint,
                geoDistance,
                geoSortUnit = 'm'
            } = geoResults;
    
            let polygon;
    
            if (geoBoxTopLeft && geoBoxBottomRight) {
                const line = lineString([parsePoint(geoBoxTopLeft), parsePoint(geoBoxBottomRight)]);
                const box = bbox(line);
                polygon = bboxPolygon(box);
            }
            
            if (geoPoint && geoDistance) {
                polygon =  createCircle(parsePoint(geoPoint), geoDistance, { units: UNIT_DICTONARY[geoSortUnit] });
            }
    
            // Nothing matches so return false
            if (!polygon) return () => false
            return (data) => {
                const point = parsePoint(data);
                return pointInPolygon(point, polygon)
            } 
        }

        function parseGeoAst(node) {
            const topField = node.field;
            if ( fields[topField]) {
                const geoQueryParameters = { geoField: topField };
                function gatherGeoQueries(node) {
                    const field = node.field;
                    if (geoParameters[field]) {
                        geoQueryParameters[geoParameters[field]] = node.term;
                    }
                    return node;
                }
                walkAst(node, gatherGeoQueries);
                filterFnBuilder(makeGeoQueryFn(geoQueryParameters));
                return { field: '__parsed', term: createParsedField(topField)}
            }
            return node;
        }


        return this.walkAst(ast, parseGeoAst);
    }
}

module.exports = GeoType;
