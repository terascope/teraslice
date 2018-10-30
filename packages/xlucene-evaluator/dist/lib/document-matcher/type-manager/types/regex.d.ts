import BaseType from './base';
import { ast } from '../../../utils';
export default class RegexType extends BaseType {
    private fields;
    constructor(regexDict: object);
    processAst(ast: ast): ast;
}
