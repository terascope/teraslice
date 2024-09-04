import { RepoConfig, InputType } from '@terascope/data-mate';
import { InputOutputCardinality } from '../../interfaces.js';

export const OneToOneMixin = (Base: any) => class extends Base {
    static cardinality: InputOutputCardinality = 'one-to-one';
};

export const ManyToOneMixin = (Base: any) => class extends Base {
    static cardinality: InputOutputCardinality = 'many-to-one';
};

export const InjectMethod = (Base: any, fn: any, config: RepoConfig) => class extends Base {
    _repoConfig = config;
    inputIsArray = config.primary_input_type === InputType.Array;
    method(...args: any[]) {
        return fn(...args);
    }
};

export const OverrideConfig = (Base: any, fn: any) => class extends Base {
    constructor(obj: any) {
        const newConfig = fn(obj);
        super(newConfig);
    }
};
