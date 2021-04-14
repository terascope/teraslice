import { isObjectEntity, cloneDeep } from '@terascope/utils';

export function recordValidationExecution(
    fn: (input: Record<string, unknown>) => boolean,
    preserveNulls: boolean
) {
    return function _row(
        input: Record<string, unknown>[]
    ): (Record<string, unknown> | null)[] {
        if (!Array.isArray(input)) {
            throw new Error('Invalid input, expected an array of objects');
        }

        const results: (Record<string, unknown>|null)[] = [];

        for (const record of input) {
            if (!isObjectEntity(record)) {
                throw new Error(`Invalid record ${JSON.stringify(record)}, expected an array of simple objects or data-entities`);
            }

            const clone = cloneDeep(record);

            // TODO: how much error handling should be here vs the function
            if (fn(clone)) {
                results.push(clone);
            } else if (preserveNulls) {
                results.push(null);
            }
        }

        return results;
    };
}
