import { xLuceneTypeConfig, xLuceneVariables } from '@terascope/types';
import { isKey } from '@terascope/utils';
import geoBoxFn from './geo/box.js';
import geoDistanceFn from './geo/distance.js';
import geoPolygonFn from './geo/polygon.js';
import geoContainsPointFn from './geo/contains-point.js';
import knnSearch from './vector/knn.js';
import { FunctionDefinition, FunctionMethods, FunctionNode } from '../interfaces.js';

export enum xLuceneFunction {
    geoDistance = 'geoDistance',
    geoBox = 'geoBox',
    geoPolygon = 'geoPolygon',
    geoContainsPoint = 'geoContainsPoint',
    knn = 'knn'
}

export const xLuceneFunctions: Record<xLuceneFunction, FunctionDefinition> = {
    geoDistance: geoDistanceFn,
    geoBox: geoBoxFn,
    geoPolygon: geoPolygonFn,
    geoContainsPoint: geoContainsPointFn,
    knn: knnSearch
};

export function initFunction({ node, variables, type_config }: {
    node: FunctionNode;
    variables?: xLuceneVariables;
    type_config: xLuceneTypeConfig;
}): FunctionMethods {
    const fnType = isKey(xLuceneFunctions, node.name)
        ? xLuceneFunctions[node.name]
        : undefined;

    if (fnType == null) {
        throw new TypeError(`Unknown xLucene function "${node.name}"`);
    }

    return fnType.create({
        type_config, node, variables: variables ?? {}
    });
}
