import { xLuceneTypeConfig, xLuceneVariables } from '@terascope/types';
import geoBoxFn from './geo/box.js';
import geoDistanceFn from './geo/distance.js';
import geoPolygonFn from './geo/polygon.js';
import geoContainsPointFn from './geo/contains-point.js';
import { FunctionDefinition, FunctionMethods, FunctionNode } from '../interfaces.js';

export enum xLuceneFunction {
    geoDistance = 'geoDistance',
    geoBox = 'geoBox',
    geoPolygon = 'geoPolygon',
    geoContainsPoint = 'geoContainsPoint',
}

export const xLuceneFunctions: Record<xLuceneFunction, FunctionDefinition> = {
    geoDistance: geoDistanceFn,
    geoBox: geoBoxFn,
    geoPolygon: geoPolygonFn,
    geoContainsPoint: geoContainsPointFn
};

export function initFunction({ node, variables, type_config }: {
    node: FunctionNode;
    variables?: xLuceneVariables;
    type_config: xLuceneTypeConfig;
}): FunctionMethods {
    const fnType = xLuceneFunctions[
        node.name as keyof typeof xLuceneFunctions
    ] as FunctionDefinition | undefined;
    if (fnType == null) {
        throw new TypeError(`Unknown xLucene function "${node.name}"`);
    }

    return fnType.create({
        type_config, node, variables: variables ?? {}
    });
}
