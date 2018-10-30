import { ast } from '../utils';
export interface cb {
    (node: ast, _field: string, depth: number): void;
}
export default class LuceneQueryParser {
    _ast: ast;
    constructor();
    parse(luceneStr: string): void;
    walkLuceneAst(preCb: cb, postCb?: cb, _argAst?: ast): any;
}
