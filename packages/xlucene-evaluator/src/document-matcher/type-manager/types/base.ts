import { AST, BooleanCB } from '../../../interfaces';
import { path, pipe } from 'rambda';

export default class BaseType {

    public parseAST(srcNode: AST, parsedFn: BooleanCB, field: string|null): AST {
        const getFieldValue = (obj: any) => {
            return path(field as string, obj);
        };
        const type = '__parsed';
        let callback;

        if (!field) {
            callback = parsedFn;
        } else {
            callback = pipe(getFieldValue, parsedFn);
        }

        const resultingAST = {
            type,
            callback,
            ...srcNode.negated && { negated: true },
            ...srcNode.or && { or: true },
        };

        return resultingAST as AST;
    }

    // TODO: look to see if this can be combined with other walkAst method
    public walkAst(ast: AST, cb: Function) {

        function walk(ast: AST, _field?: string) {
            const topField = ast.field || _field;
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

    public processAst(ast: AST) {
        return ast;
    }
}
