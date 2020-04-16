/* eslint-disable max-classes-per-file */

import { InputOutputCardinality } from '../../interfaces';

export const OneToOneMixin = (Base: any) => class extends Base {
    static cardinality: InputOutputCardinality = 'one-to-one';
};

export const ManyToOneMixin = (Base: any) => class extends Base {
    static cardinality: InputOutputCardinality = 'many-to-one';
};

export const InjectMethod = (Base: any, entity: any, methodName: string) => class extends Base {
    static _method_config = entity[methodName];
    method(...args: any[]) {
        return entity[methodName](...args);
    }
};
