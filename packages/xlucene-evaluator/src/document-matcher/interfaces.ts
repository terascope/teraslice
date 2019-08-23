import { ParserOptions } from '../parser';

export interface DocumentMatcherOptions extends ParserOptions {
}

export type BooleanCB = (data: any) => boolean;
export type DateInput = string | number;
