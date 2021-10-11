// eslint-disable-next-line max-classes-per-file
import { SimpleValueMatchTuple } from '../vector/interfaces';

export enum SimpleMatchOperator {
    AND = 'AND',
    OR = 'OR',
    NEGATE = 'NEGATE',
    /**
     * This is used when there is only field match tuples stored
    */
    NONE = 'NONE'
}

/**
 * This is a class which defines AND/OR groupings of
 * our simple field match tuples
*/
export class SimpleMatchCriteria {
    constructor(
        readonly criteria: (readonly SimpleMatchCriteria[])|SimpleFieldMatch,
        readonly operator: SimpleMatchOperator,
    ) {
    }
}

export class SimpleFieldMatch {
    constructor(
        /**
         * If the field is null, this means search all fields
        */
        readonly field: string|null,
        readonly tuples: SimpleValueMatchTuple[]
    ) {}
}
