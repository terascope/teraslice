import { xLuceneTypeConfig, xLuceneVariables } from '@terascope/types';
import { isKey } from '@terascope/utils';
import geoBoxFn from './geo/box.js';
import geoDistanceFn from './geo/distance.js';
import geoPolygonFn from './geo/polygon.js';
import geoContainsPointFn from './geo/contains-point.js';
import knnSearch from './vector/knn.js';
import { FunctionDefinition, FunctionMethods, FunctionNode } from '../interfaces.js';

/**
 * Enumeration of available xLucene functions.
 * 
 * These functions provide specialized query capabilities,
 * particularly for geospatial operations.
 */
export enum xLuceneFunction {
    geoDistance = 'geoDistance',
    geoBox = 'geoBox',
    geoPolygon = 'geoPolygon',
    geoContainsPoint = 'geoContainsPoint',
    knn = 'knn'
}

/**
 * Registry of available xLucene function implementations.
 * 
 * Maps function names to their corresponding function definitions
 * that provide the implementation logic.
 */
export const xLuceneFunctions: Record<xLuceneFunction, FunctionDefinition> = {
    geoDistance: geoDistanceFn,
    geoBox: geoBoxFn,
    geoPolygon: geoPolygonFn,
    geoContainsPoint: geoContainsPointFn,
    knn: knnSearch
};

/**
 * Initialize a function node with the appropriate implementation.
 * 
 * This function looks up the function implementation based on the node's name
 * and creates an instance configured with the provided variables and type config.
 * 
 * @param config - Configuration object
 * @param config.node - The function node from the AST
 * @param config.variables - Variables for parameter resolution
 * @param config.type_config - Field type configuration
 * @returns Function methods for matching and query generation
 * @throws {TypeError} If the function name is not recognized
 * 
 * @example
 * ```typescript
 * const functionMethods = initFunction({
 *   node: geoDistanceNode,
 *   variables: { maxDist: '10km' },
 *   type_config: { location: 'geo' }
 * });
 * ```
 */
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
