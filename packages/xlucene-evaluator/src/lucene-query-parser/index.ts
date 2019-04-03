import { debugLogger } from '@terascope/utils';
import parser from '../peg';
import { AST, AstCallback, IMPLICIT, MappingAstCallback } from '../interfaces';

const logger = debugLogger('lucene-query-parser');

export default class LuceneQueryParser {
    // @ts-ignore because this will populated after set
    _ast: AST = {};

    public parse(luceneStr: string): void {
        // @ts-ignore
        this._ast = {};

        try {
            this._ast = parser.parse(luceneStr);
            logger.trace(`parsed ${luceneStr} to `, this._ast);
        } catch (err) {
            throw new Error(`error occured while attempting to parse lucene query: ${luceneStr} , error: ${err.message}`);
        }
    }

    public mapAst(cb: MappingAstCallback, _argAst?: AST) {
        const ast = _argAst || this._ast;

        function walk(ast: AST, _field?: string) {
            const topField = (ast.field && ast.field !== IMPLICIT) ? ast.field : _field;
            const node = cb(ast, topField);

            if (node.right) {
                node.right = walk(node.right, topField);
            }

            if (node.left) {
                node.left = walk(node.left, topField);
            }
            return node;
        }

        return walk(ast);
    }

    public walkLuceneAst(cb: AstCallback, _argAst?: AST): any {
        const ast = _argAst || this._ast;

        function walk(node: AST, _field: string): void {
            const topField = (node.field && node.field !== IMPLICIT) ? node.field : _field;
            cb(node, topField);

            if (node.left) {
                walk(node.left, topField);
            }

            if (node.right) {
                walk(node.right, topField);
            }
        }

        return walk(ast, '');
    }
}
