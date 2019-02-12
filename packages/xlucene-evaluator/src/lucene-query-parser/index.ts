
import parser from '../peg';
import { AST, AstCallback } from '../interfaces';
import { IMPLICIT } from '../constants';

export default class LuceneQueryParser {
    // @ts-ignore because this will populated after set
    _ast: AST = {};

    public parse(luceneStr: string): void {
        // @ts-ignore because this will populated after set
        this._ast = {};
        try {
            this._ast = parser.parse(luceneStr);
        } catch (err) {
            throw new Error(`error occured while attempting to parse lucene query: ${luceneStr} , error: ${err.message}`);
        }
    }

    public walkLuceneAst(preCb: AstCallback, postCb?: AstCallback, _argAst?: AST): any {
        const ast = _argAst || this._ast;

        function walk(node: AST, _field: string, depth: number): void {
            const topField = (node.field && node.field !== IMPLICIT) ? node.field : _field;

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
