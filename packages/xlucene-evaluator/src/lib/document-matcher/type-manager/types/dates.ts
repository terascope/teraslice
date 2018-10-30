
import BaseType from './base';
import { bindThis, ast } from '../../../utils';

// TODO: handle datemath

export default class DateType extends BaseType {
    private fields: object;

    constructor(dateFieldDict: object) {
        super();
        this.fields = dateFieldDict;
        bindThis(this, DateType);
    }

    processAst(ast: ast): ast {
        const { fields } = this;

        function parseDates(node: ast, _field?: string) {
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
        const { fields } = this;
        for (const key in fields) {
            if (data[key]) {
                data[key] = new Date(data[key]).getTime();
            }
        }
        return data;
    }

}
