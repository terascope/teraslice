import { DataTypeFieldConfig } from '@terascope/types';

export function isSameFieldConfig(
    a: Readonly<DataTypeFieldConfig>, b: Readonly<DataTypeFieldConfig>
): boolean {
    if (Object.is(a, b)) return true;
    if (a.type !== b.type) return false;

    const aArray = a.array ?? false;
    const bArray = a.array ?? false;
    if (aArray !== bArray) return false;

    if (a.format !== b.format) return false;

    if (a.locale !== b.locale) return false;

    return true;
}
