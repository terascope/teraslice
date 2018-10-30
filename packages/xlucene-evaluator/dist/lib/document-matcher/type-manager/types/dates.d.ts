import BaseType from './base';
import { ast } from '../../../utils';
export default class DateType extends BaseType {
    private fields;
    constructor(dateFieldDict: object);
    processAst(ast: ast): ast;
    formatData(data: object): object;
}
