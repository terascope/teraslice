'use strict';

const pointInPolygon = require('@turf/boolean-point-in-polygon');
const createCircle = require('@turf/circle');
const bbox = require('@turf/bbox').default;
const bboxPolygon = require('@turf/bbox-polygon');
const { lineString } = require('@turf/helpers');
const BaseType = require('./base');

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

class GeoType extends BaseType {
    constructor(dateFieldDict) {
        super();
        this.fields = dateFieldDict;
        bindThis(this, DateType);
    }


    //TODO: is geo_sort_unit correct name for units?
    const geoParameters = {
        _geo_point_: 'geoPoint',
        _geo_distance_: 'geoDistance',
        _geo_box_top_left_: 'geoBoxTopLeft',
        _geo_box_bottom_right_: 'geoBoxBottomRight',
        _geo_sort_unit_: 'geoSortUnit'
    };
    const geoResults = {};

    
    //TODO: dont mutate raw ast, have another one

    function parseGeoQueries(node){
        //console.log('parseGeoQueries is calling', node, !geoResults['geoField'], _.get(node, 'left.field'), geoParameters[_.get(node, 'left.field')], !geoResults['geoField'] && (geoParameters[_.get(node, 'right.field')] || geoParameters[_.get(node, 'left.field')]))
        if (!geoResults['geoField'] && (geoParameters[_.get(node, 'right.field')] || geoParameters[_.get(node, 'left.field')])) {
            geoResults['geoField'] = node.field
        }

        if (geoParameters[node.field]) {
            geoResults[geoParameters[node.field]] = node.term
        }

    }


    function parsePoint(str){
        return str.split(',').map(st => st.trim()).map(numStr => Number(numStr)).reverse();
    }

    function makeGeoQueryFn() {
      
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
            const point = parsePoint(data[geoField]);
            return pointInPolygon(point, polygon)
        } 
    }

    if (hasGeoTypes) {
        let myast = this._ast;
        console.log('the top ast there is',JSON.stringify(myast, null, 4))
        this.walkLuceneAst(parseGeoQueries);
        if (Object.keys(geoResults).length > 0) {
            geoQuery = makeGeoQueryFn(geoResults)
            const clone = _.cloneDeep(ast);
            function alterCloneAst(node){
                if (node.field === geoResults['geoField']) {
                    return { field: '__parsed', term: 'geoFn(data)'};
                }
                return node
            }
            
            function alterAst(ast) {
                //const results = alterCloneAst(ast);
            
                function walk(ast){
                    const node = alterCloneAst(ast);
            
                    if (node.right) {
                        node.right = walk(node.right)
                    }
            
                    if (node.left) {
                        node.left = walk(node.left)
                    }
                    return node;
                }
            
               return walk(ast)
              // return results;
            }

            parsedAst = alterAst(clone);
        }
    }
}