import { AST } from '../../../interfaces';

export default class BaseType {
    private fnID: number;
    private injectorFns: object;
    private fnBaseName?: string;
    public filterFnBuilder: Function;
    public createParsedField: Function;
    public injectTypeFilterFns: Function;

    constructor(fnBaseName?: string) {
        this.fnID = 0;
        this.injectorFns = {};
        if (fnBaseName) this.fnBaseName = fnBaseName;

        this.filterFnBuilder = (cb: Function): void => {
            this.fnID += 1;
            this.injectorFns[`${this.fnBaseName}${this.fnID}`] = cb;
        };

        this.createParsedField = (field?: string): string => {
            const args = field != null ? `data.${field}` : 'data';
            return `${this.fnBaseName}${this.fnID}(${args})`;
        };

        this.injectTypeFilterFns = () => {
            return Object.keys(this.injectorFns).length > 0 ? this.injectorFns : null;
        };
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
