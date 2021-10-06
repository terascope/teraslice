import { DataType } from '@terascope/data-types';
import { xLuceneTypeConfig, xLuceneVariables } from '@terascope/types';
import * as p from 'xlucene-parser';
import type { BooleanCB } from '../../document-matcher/interfaces';
import buildLogicFn from '../../document-matcher/logic-builder';
import type { DataFrame } from '../DataFrame';

export function buildSearchMatcherForQuery(
    frame: DataFrame<any>,
    query: string,
    variables?: xLuceneVariables,
    _overrideParsedQuery?: p.Node
): BooleanCB {
    const parser = new p.Parser(
        query,
        { type_config: frameToXluceneConfig(frame) },
        _overrideParsedQuery
    );

    if (variables) {
        return buildLogicFn(
            parser.resolveVariables(variables),
            variables
        );
    }
    return buildLogicFn(parser);
}

function frameToXluceneConfig(frame: DataFrame<any>): xLuceneTypeConfig {
    const dataType = new DataType(frame.config);
    return dataType.toXlucene();
}
