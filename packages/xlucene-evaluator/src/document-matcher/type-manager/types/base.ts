import { getFieldValue } from '../../../utils';
import { AST, BooleanCB } from '../../../interfaces';
import { pipe } from 'rambda';

export default abstract class BaseType {

    public parseNode(srcNode: AST, parsedFn: BooleanCB, field: string|null): AST {
        const type = '__parsed';
        let callback;

        if (!field) {
            callback = parsedFn;
        } else {
            const getField = getFieldValue(field);
            callback = pipe(getField, parsedFn);
        }

        const resultingAST = {
            type,
            callback,
            ...srcNode.negated && { negated: true },
            ...srcNode.or && { or: true },
        };

        return resultingAST as AST;
    }

    abstract processAst(node: AST, _field?: string): AST;
}
