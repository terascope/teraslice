import { deprecate } from 'util';
import {
    DataEntity,
    isPlainObject,
    getFirst,
    castArray,
    isString,
    DataWindow
} from '@terascope/utils';

const deprecateType = deprecate(
    (result: any): DataEntity[] => castArray<DataEntity>(result),
    'Legacy processors should return an array of Objects or DataEntities'
);

/**
 * Convert legacy processor results into DataEntities if possible.
 * But in order to be more backwards compatible legacy modules
 * can return an array of buffers or strings.
*/
export function convertResult(input: unknown): DataEntity[] {
    if (input == null) return [];
    if (DataEntity.isArray(input)) return input;
    if (DataWindow.is(input)) return input as DataEntity[];
    if (DataEntity.is(input)) return [input];

    const first = getFirst<Record<string, any>|string|Buffer>(input as any);
    if (first == null) return [];

    if (Array.isArray(first)) return input as DataEntity[];

    if (Buffer.isBuffer(first) || isString(first)) return deprecateType(input);
    if (isPlainObject(first)) return DataEntity.makeArray(input as any);

    throw new Error('Invalid return type for processor');
}
