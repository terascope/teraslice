import { DataType } from '@terascope/data-types';
import { xLuceneTypeConfig, xLuceneVariables } from '@terascope/types';
import * as p from 'xlucene-parser';
import type { DataFrame } from '../DataFrame';
import { buildMatcherForNode } from './buildMatcherForNode';

export function buildSearchMatcherForQuery(
    frame: DataFrame<any>,
    query: string,
    variables?: xLuceneVariables,
    _overrideParsedQuery?: p.Node
): (frame: DataFrame<any>, rowIndex: number) => boolean {
    let parser = new p.Parser(
        query,
        { type_config: frameToXluceneConfig(frame) },
        _overrideParsedQuery
    );

    if (variables) {
        parser = parser.resolveVariables(variables);
    }
    return buildMatcherForNode(parser.typeConfig, variables ?? {})(
        parser.ast
    );
}

function frameToXluceneConfig(frame: DataFrame<any>): xLuceneTypeConfig {
    return new DataType(frame.config).toXlucene();
}
