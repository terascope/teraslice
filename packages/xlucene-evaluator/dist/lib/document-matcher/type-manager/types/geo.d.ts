import BaseType from './base';
import { ast } from '../../../utils';
export default class GeoType extends BaseType {
    private fields;
    constructor(geoFieldDict: object);
    processAst(ast: ast): ast;
}
