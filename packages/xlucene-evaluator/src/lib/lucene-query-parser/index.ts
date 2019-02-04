
import parser from '../peg';
import { AST, AstCallback } from '../interfaces';

export default class LuceneQueryParser {
    _ast: AST;

    constructor() {
        this._ast = {};
    }

    public parse(luceneStr: string): void {
        try {
            // @ts-ignore
            this._ast = parser.parse(luceneStr);
        } catch (err) {
            throw new Error(`error occured while attempting to parse lucene query: ${luceneStr} , error: ${err.message}`);
        }
    }

    public walkLuceneAst(preCb: AstCallback, postCb?: AstCallback, _argAst?: AST): any {
        const ast = _argAst || this._ast;

        function walk(node: AST, _field: string, depth: number): void {
            const topField = (node.field && node.field !== '<implicit>') ? node.field : _field;

            if (node.left) {
                walk(node.left, topField, depth + 1);
            }

            preCb(node, topField, depth);

            if (node.right) {
                walk(node.right, topField, depth + 1);
            }
            if (postCb) postCb(node, topField, depth);
        }

        return walk(ast, '', 0);
    }
}
