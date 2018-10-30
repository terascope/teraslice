import { ast } from '../../../utils';
export default class BaseType {
    private fnID;
    private injectorFns;
    private fnBaseName?;
    filterFnBuilder: Function;
    createParsedField: Function;
    injectTypeFilterFns: Function;
    constructor(fnBaseName?: string);
    walkAst(ast: ast, cb: Function): any;
    processAst(ast: ast): ast;
    formatData(data: object): object;
}
