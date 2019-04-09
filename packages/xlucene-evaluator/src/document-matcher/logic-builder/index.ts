
import _ from 'lodash';
import { not, allPass, anyPass } from 'rambda';

import {
    checkValue,
    parseGeoPoint
} from '../../utils';

import { TypeConfig, BooleanCB } from '../../interfaces';

import pointInPolygon from '@turf/boolean-point-in-polygon';
// @ts-ignore
import createCircle from '@turf/circle';
import bbox from '@turf/bbox';
import bboxPolygon from '@turf/bbox-polygon';
import { lineString } from '@turf/helpers';

import {
    Parser,
    AST,
    Range,
    GeoDistance,
    GeoBoundingBox,

    getAnyValue,
    getField,

    isTerm,
    isExists,
    isRange,
    // @ts-ignore
    isConjunction,
    isLogicalGroup,
    isNegation,
    isFieldGroup,
    isGeoDistance,
    isGeoBoundingBox
} from '../../parser';

const negate = (fn:any) => (data:any) => not(fn(data));

const logicNode = (boolFn: BooleanCB, node:AST) => {
    if (isNegation(node)) return negate(boolFn);
    return boolFn;
};

export default function buildLogicFn(parser: Parser, typeConfig: TypeConfig|undefined) {
    // const types = new TypeManager(parser, typeConfig);
    // const parsedAst = types.processAst();
    // console.log('original ast', JSON.stringify(parser.ast, null, 4));
    function walkAst(node: AST): BooleanCB {
        let fnResults;
        const value = getAnyValue(node);
        const field = getField(node);

        if (isNegation(node)) {
            // @ts-ignore
            const childLogic = walkAst(node.node);
            fnResults = negate(childLogic);
        }

        // TODO: Deal with regex and wildcard
        if (isTerm(node)) {
            const isValue = (data: any) => {
                return data === value;
            };
            const fn = checkValue(field as string, isValue);
            fnResults = logicNode(fn, node);
        }

        if (isGeoDistance(node)) {
            const fn = checkValue(field as string, geoDistanceFn(node));
            fnResults = logicNode(fn, node);
        }

        if (isGeoBoundingBox(node)) {
            const fn = checkValue(field as string, geoBoundingBoxFn(node));
            fnResults = logicNode(fn, node);
        }

        if (isExists(node)) {
            const valueExists = (value: any) => value != null;
            const fn = checkValue(field, valueExists);
            fnResults = logicNode(fn, node);
        }

        if (isRange(node)) {
            const fn = checkValue(field, rangeFn(node));
            fnResults = logicNode(fn, node);
        }

        if (isLogicalGroup(node) || isFieldGroup(node)) {
            const logicGroups: BooleanCB[] = [];

            node.flow.forEach(conjunction => {
                const conjunctionRules = conjunction.nodes.map(node => walkAst(node));
                logicGroups.push(allPass(conjunctionRules));
            });

            fnResults = logicNode(anyPass(logicGroups), node);
        }

        if (!fnResults) fnResults = () => false;
        return fnResults;
    }

    return walkAst(parser.ast);
}

function rangeFn(node: Range): BooleanCB {
    const mapping = {
        gte: _.gte,
        gt: _.gt,
        lte: _.lte,
        lt: _.lt
    };
    const { left, right } = node;

    if (!right) {
        return (data: any) => mapping[left.operator](data, left.value);
    }

    return (data: any) => mapping[left.operator](data, left.value) && mapping[right.operator](data, right.value);
}

const testGeoPolygon = (polygon: any) => (fieldData: string) => {
    const point = parseGeoPoint(fieldData, false);
    if (!point) return false;
    return pointInPolygon(point, polygon);
};

function geoDistanceFn(node:GeoDistance) {
    const { distance, unit, lat, lon } = node;
    const geoPoint = [lon, lat];
    const config = { units: unit };
    let polygon: createCircle;

    if (lat != null && lon != null) {
        polygon = createCircle(
            geoPoint,
            distance,
            config
        );
    }

    // Nothing matches so return false
    if (polygon == null) return () => false;
    return testGeoPolygon(polygon);
}

function geoBoundingBoxFn(node:GeoBoundingBox) {
    const topLeft = [node.top_left.lon, node.top_left.lat];
    const bottomRight = [node.bottom_right.lon, node.bottom_right.lat];

    const line = lineString([
        topLeft,
        bottomRight,
    ]);

    const box = bbox(line);
    const polygon = bboxPolygon(box);

    // Nothing matches so return false
    if (polygon == null) return () => false;
    return testGeoPolygon(polygon);
}
