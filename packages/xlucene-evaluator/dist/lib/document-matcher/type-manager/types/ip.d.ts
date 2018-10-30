import BaseType from './base';
import { ast } from '../../../utils';
export default class IpType extends BaseType {
    private fields;
    constructor(ipFieldDict: object);
    processAst(ast: ast): ast;
}
