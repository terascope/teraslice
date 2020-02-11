import { ParserOptions } from '../parser';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DocumentMatcherOptions extends ParserOptions {
}

export type BooleanCB = (data: any) => boolean;
export type DateInput = string | number;
