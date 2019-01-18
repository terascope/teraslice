
import BaseType from './base';
import { bindThis, AST } from '../../../utils';
import _ from 'lodash';

// TODO: handle datemath

export default class DateType extends BaseType {
    private fields: object;

    constructor(dateFieldDict: object) {
        super();
        this.fields = dateFieldDict;
        bindThis(this, DateType);
    }

    processAst(ast: AST): AST {
        // tslint:disable-next-line no-this-assignment
        const { fields } = this;

        function parseDates(node: AST, _field?: string) {
            const topField = node.field || _field;

            function convert(value: string | number): any {
                const results = new Date(value).getTime();
                if (results) return results;
                return value;
            }

            if (topField && fields[topField]) {
                if (node.term) node.term = convert(node.term);
                if (node.term_max) node.term_max = convert(node.term_max);
                if (node.term_min) node.term_min = convert(node.term_min);
            }
            return node;
        }

        return this.walkAst(ast, parseDates);
    }

    formatData(data: object): object {
        const clone = _.cloneDeep(data);

        for (const key in this.fields) {
            if (clone[key]) {
                clone[key] = new Date(data[key]).getTime();
            }
        }
        return clone;
    }

}
