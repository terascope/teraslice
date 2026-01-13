import { DataType } from '@terascope/data-types';
import { xLuceneTypeConfig, xLuceneVariables } from '@terascope/types';
import * as p from 'xlucene-parser';
import type { DataFrame } from '../DataFrame.js';
import { buildMatcherForNode } from './buildMatcherForNode.js';

export function buildSearchMatcherForQuery(
    dataFrame: DataFrame<any>,
    query: string,
    variables?: xLuceneVariables,
    _overrideParsedQuery?: p.Node
): (rowIndex: number) => boolean {
    const parser = new p.Parser(
        query,
        { type_config: frameToXluceneConfig(dataFrame), variables },
        _overrideParsedQuery
    );

    return buildMatcherForNode(dataFrame, parser.typeConfig, variables ?? {})(
        parser.ast
    );
}

function frameToXluceneConfig(frame: DataFrame<any>): xLuceneTypeConfig {
    return new DataType(frame.config).toXlucene();
}
