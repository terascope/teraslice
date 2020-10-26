import { xLuceneTypeConfig, xLuceneVariables } from '@terascope/types';
import geoBoxFn from './geo/box';
import geoDistanceFn from './geo/distance';
import geoPolygonFn from './geo/polygon';
import geoContainsPointFn from './geo/contains-point';
import { FunctionDefinition, FunctionMethods, FunctionNode } from '../interfaces';

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
    node: FunctionNode,
    variables?: xLuceneVariables,
    type_config: xLuceneTypeConfig,
}): FunctionMethods {
    const fnType = xLuceneFunctions[node.name] as FunctionDefinition|undefined;
    if (fnType == null) {
        throw new Error(`Could not find an xLucene function with name "${name}"`);
    }

    return fnType.create({
        type_config, node, variables: variables ?? {}
    });
}
