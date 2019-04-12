
// @ts-ignore
import Tracer from 'pegjs-backtrace';
import { AST } from './interfaces';

export interface PegEngine {
    parse(input: string, options?: PegEngineOptions): AST;
}

export interface PegEngineOptions {
    tracer?: any;
    filename?: string;
    startRule?: string;
}

let parser: PegEngine;

try {
     // @ts-ignore because the types don't exist
    parser = require('../../peg/peg-engine.js');
} catch (err) {
    // @ts-ignore because the types don't exist
    parser = require('../../../peg/peg-engine.js');
}

export { Tracer };
export default parser;
