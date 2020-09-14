import { isBooleanLike, toBoolean } from '@terascope/utils';
import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../builder';

export class BooleanBuilder extends Builder<boolean> {
    static valueFrom(value: unknown): boolean {
        if (!isBooleanLike(value)) {
            throw new TypeError(`Expected ${value} to be boolean like`);
        }
        return toBoolean(value);
    }

    constructor(options: BuilderOptions<boolean>) {
        super(VectorType.Boolean, {
            valueFrom: BooleanBuilder.valueFrom,
            ...options,
        });
    }
}
