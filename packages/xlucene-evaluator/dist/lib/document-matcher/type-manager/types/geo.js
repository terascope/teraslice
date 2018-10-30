"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const boolean_point_in_polygon_1 = __importDefault(require("@turf/boolean-point-in-polygon"));
const circle_1 = __importDefault(require("@turf/circle"));
const bbox_1 = __importDefault(require("@turf/bbox"));
const bbox_polygon_1 = __importDefault(require("@turf/bbox-polygon"));
const helpers_1 = require("@turf/helpers");
const base_1 = __importDefault(require("./base"));
const utils_1 = require("../../../utils");
// feet
const MileUnits = {
    mi: 'miles',
    miles: 'miles',
    mile: 'miles',
};
const NMileUnits = {
    NM: 'nauticalmiles',
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
// TODO: is geo_sort_unit correct name for units?
const geoParameters = {
    _geo_point_: 'geoPoint',
    _geo_distance_: 'geoDistance',
    _geo_box_top_left_: 'geoBoxTopLeft',
    _geo_box_bottom_right_: 'geoBoxBottomRight',
    _geo_sort_unit_: 'geoSortUnit'
};
const fnBaseName = 'geoFn';
class GeoType extends base_1.default {
    constructor(geoFieldDict) {
        super(fnBaseName);
        this.fields = geoFieldDict;
        utils_1.bindThis(this, GeoType);
    }
    processAst(ast) {
        const { walkAst, filterFnBuilder, createParsedField, fields } = this;
        function parsePoint(str) {
            return str.split(',').map(st => st.trim()).map(numStr => Number(numStr)).reverse();
        }
        function parseDistance(str) {
            const trimed = str.trim();
            const matches = trimed.match(/(\d+)(.*)$/);
            if (!matches)
                throw new Error(`Incorrect geo distance parameter provided: ${str}`);
            const distance = Number(matches[1]);
            const unit = UNIT_DICTONARY[matches[2]];
            if (!unit)
                throw new Error(`incorrect distance unit provided: ${matches[2]}`);
            return { distance, unit };
        }
        function makeGeoQueryFn(geoResults) {
            const { geoBoxTopLeft, geoBoxBottomRight, geoPoint, geoDistance, } = geoResults;
            let polygon;
            if (geoBoxTopLeft && geoBoxBottomRight) {
                const line = helpers_1.lineString([parsePoint(geoBoxTopLeft), parsePoint(geoBoxBottomRight)]);
                const box = bbox_1.default(line);
                polygon = bbox_polygon_1.default(box);
            }
            if (geoPoint && geoDistance) {
                const { distance, unit } = parseDistance(geoDistance);
                const config = { units: unit };
                polygon = circle_1.default(parsePoint(geoPoint), distance, config);
            }
            // Nothing matches so return false
            if (polygon === undefined)
                return () => false;
            return (fieldData) => {
                const point = parsePoint(fieldData);
                return boolean_point_in_polygon_1.default(point, polygon);
            };
        }
        function parseGeoAst(node, _field) {
            const topField = node.field || _field;
            //TODO: check topfield and _field passed in
            if (topField && fields[topField]) {
                const geoQueryParameters = { geoField: topField };
                function gatherGeoQueries(node) {
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
exports.default = GeoType;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VvLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL2xpYi9kb2N1bWVudC1tYXRjaGVyL3R5cGUtbWFuYWdlci90eXBlcy9nZW8udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFDQSw4RkFBNEQ7QUFDNUQsMERBQXdDO0FBQ3hDLHNEQUE4QjtBQUM5QixzRUFBNkM7QUFDN0MsMkNBQW1EO0FBQ25ELGtEQUE4QjtBQUM5QiwwQ0FBK0M7QUFFL0MsT0FBTztBQUNQLE1BQU0sU0FBUyxHQUFHO0lBQ2QsRUFBRSxFQUFFLE9BQU87SUFDWCxLQUFLLEVBQUUsT0FBTztJQUNkLElBQUksRUFBRSxPQUFPO0NBQ2hCLENBQUM7QUFDRixNQUFNLFVBQVUsR0FBRztJQUNmLEVBQUUsRUFBQyxlQUFlO0lBQ2xCLEdBQUcsRUFBRSxlQUFlO0lBQ3BCLFlBQVksRUFBRSxlQUFlO0lBQzdCLGFBQWEsRUFBRSxlQUFlO0NBQ2pDLENBQUM7QUFDRixNQUFNLFNBQVMsR0FBRztJQUNkLEVBQUUsRUFBRSxRQUFRO0lBQ1osSUFBSSxFQUFFLFFBQVE7SUFDZCxNQUFNLEVBQUUsUUFBUTtDQUNuQixDQUFDO0FBQ0YsTUFBTSxTQUFTLEdBQUc7SUFDZCxFQUFFLEVBQUUsT0FBTztJQUNYLElBQUksRUFBRSxPQUFPO0lBQ2IsS0FBSyxFQUFFLE9BQU87Q0FDakIsQ0FBQztBQUNGLE1BQU0sVUFBVSxHQUFHO0lBQ2YsQ0FBQyxFQUFFLFFBQVE7SUFDWCxLQUFLLEVBQUUsUUFBUTtJQUNmLE1BQU0sRUFBRSxRQUFRO0NBQ25CLENBQUM7QUFDRixNQUFNLGNBQWMsR0FBRztJQUNuQixFQUFFLEVBQUUsWUFBWTtJQUNoQixTQUFTLEVBQUUsWUFBWTtJQUN2QixVQUFVLEVBQUUsWUFBWTtDQUMzQixDQUFDO0FBQ0YsTUFBTSxlQUFlLEdBQUc7SUFDcEIsRUFBRSxFQUFFLGFBQWE7SUFDakIsVUFBVSxFQUFFLGFBQWE7SUFDekIsV0FBVyxF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