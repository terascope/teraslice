import { isBooleanLike, toBooleanOrThrow } from '@terascope/utils';
import { BooleanCB } from '../interfaces';

export function isBooleanMatch(value: unknown): BooleanCB {
    const valueBoolean = toBooleanOrThrow(value);
    return function _isBooleanMatch(bool: unknown) {
        if (!isBooleanLike(bool)) return false;
        return toBooleanOrThrow(bool) === valueBoolean;
    };
}
