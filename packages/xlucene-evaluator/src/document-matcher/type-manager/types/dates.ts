
import _ from 'lodash';
import dateFns from 'date-fns';
import BaseType from './base';
import { bindThis, isInfiniteMax, isInfiniteMin } from '../../../utils';
import { AST, DateInput, BooleanCB } from '../../../interfaces';

// TODO: handle datemath

export default class DateType extends BaseType {
    private fields: object;

    constructor(dateFieldDict: object) {
        super();
        this.fields = dateFieldDict;
        bindThis(this, DateType);
    }

    processAst(ast: AST): AST {

        const parseDates = (node: AST, _field?: string) => {
            const topField = node.field || _field;
            // TODO: verify return type of string here
            function convert(value: DateInput): number | null {
                const results = new Date(value).getTime();
                if (results) return results;
                return null;
            }
            // @ts-ignore
            if (topField && this.fields[topField]) {
                let dateFn: BooleanCB;
                const { inclusive_min: incMin, inclusive_max: incMax } = node;
                let { term_min: minValue, term_max: maxValue } = node;
                // javascript min/max date allowable http://www.ecma-international.org/ecma-262/5.1/#sec-15.9.1.1
                if (isInfiniteMin(minValue)) minValue = -8640000000000000;
                if (isInfiniteMax(maxValue)) maxValue = 8640000000000000;

                if (node.term != null) {
                    const nodeTermTime = convert(node.term);
                    if (!nodeTermTime) throw new Error(`was not able to convert ${node.term} to a date value`);
                    dateFn = (date: string) =>  convert(date) === nodeTermTime;
                } else {
                    if (!incMin) {
                        const convertedValue = typeof minValue === 'number' ? minValue : convert(minValue as DateInput);
                        if (!convertedValue) throw new Error(`was not able to convert ${minValue} to a date value`);
                        minValue = convertedValue + 1;
                    }
                    if (!incMax) {
                        const convertedValue = typeof maxValue === 'number' ? maxValue : convert(maxValue as DateInput);
                        if (!convertedValue) throw new Error(`was not able to convert ${maxValue} to a date value`);
                        maxValue = convertedValue - 1;
                    }

                    dateFn = (date: string) => dateFns.isWithinRange(date, minValue as DateInput, maxValue as DateInput);
                }

                return this.parseAST(node, dateFn, topField);
            }
            return node;
        };

        return this.walkAst(ast, parseDates);
    }
}
