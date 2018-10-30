import BaseType from './types/base';
import { ast } from '../../utils';
export default class TypeManager {
    typeList: BaseType[];
    constructor(typeConfig?: object | undefined);
    private _buildFieldListConfig;
    processAst(ast: ast): ast;
    formatData(doc: object): object;
    injectTypeFilterFns(): object;
}
