import { Maybe } from '@terascope/types';
import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../builder';

/**
 * @todo this should probably be handled better
 */
export class DateBuilder extends Builder<string> {
    static valueFrom(value: unknown): Maybe<string> {
        if (value == null) return null;
        return String(value);
    }

    constructor(options: BuilderOptions<string>) {
        super(VectorType.Date, {
            valueFrom: DateBuilder.valueFrom,
            ...options,
        });
    }
}
