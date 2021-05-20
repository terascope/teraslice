import { isObjectEntity, cloneDeep } from '@terascope/utils';

export function recordValidationExecution<T extends Record<string, any>>(
    fn: (input: T) => boolean,
) {
    return function _row(
        input: T[]
    ): Record<string, unknown>[] {
        if (!Array.isArray(input)) {
            throw new Error('Invalid input, expected an array of objects');
        }

        const results: T[] = [];

        for (const record of input) {
            if (!isObjectEntity(record)) {
                throw new Error(`Invalid record ${JSON.stringify(record)}, expected an array of simple objects or data-entities`);
            }

            const clone = cloneDeep(record);

            // TODO: how much error handling should be here vs the function
            if (fn(clone)) {
                results.push(clone);
            }
        }

        return results;
    };
}
