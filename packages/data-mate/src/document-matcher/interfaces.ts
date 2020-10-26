import { xLuceneVariables } from '@terascope/types';
import { ParserOptions } from 'xlucene-parser';

export interface DocumentMatcherOptions extends ParserOptions {
    variables?: xLuceneVariables;
}

export type BooleanCB = (data: any) => boolean;
export type DateInput = string | number;
