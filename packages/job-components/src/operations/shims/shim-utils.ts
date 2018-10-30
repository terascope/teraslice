import { deprecate } from 'util';
import DataEntity, { DataInput } from '../data-entity';
import { isPlainObject, getFirst, castArray, isString } from '../../utils';

/**
 * Convert legacy processor results into DataEntities if possible.
 * But in order to be more backwards compatible legacy modules
 * can return an array of buffers or strings.
*/
export function convertResult(input: DataInput[]|Buffer[]|string[]): DataEntity[]  {
    if (input == null) return [];
    if (Array.isArray(input) && input.length === 0) return [];

    if (DataEntity.isDataEntityArray(input)) return input;
    if (DataEntity.isDataEntity(input)) return [input];
    const first = getFirst(input);
    if (first == null) return [];

    if (isPlainObject(first)) return DataEntity.makeArray(input);
    if (Buffer.isBuffer(first)) {
        return deprecateType(input);
    }
    if (isString(first)) {
        return deprecateType(input);
    }

    throw new Error('Invalid return type for processor');
}

const deprecateType = deprecate((result: any): DataEntity[] => {
    return castArray<DataEntity>(result);
}, 'Legacy processors should return an array of Objects or DataEntities');
