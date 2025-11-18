import { bigIntToJSON, isPlainObject, toBigInt } from '@terascope/core-utils';

const BIG_INT_PREFIX = '__transformed_bigint_';
/**
 * Converts the Metadata to JSON compatible objects
 * so it can be serialized
*/
export function convertMetadataToJSON(
    input: Record<string, unknown>
): Record<string, unknown> {
    return _convertValueToJSON(input).value as Record<string, unknown>;
}

function _convertValueToJSON(value: unknown): { value: unknown; transformed: boolean } {
    if (typeof value === 'bigint') {
        return {
            value: bigIntToJSON(value),
            transformed: true,
        };
    }

    if (isPlainObject(value)) {
        const metadata: Record<string, unknown> = Object.create(null);
        const entries = Object.entries(value as Record<string, unknown>);
        let transformedCount = 0;
        for (const [field, nestedValue] of entries) {
            const v = _convertValueToJSON(nestedValue);
            if (v.transformed) {
                metadata[`${BIG_INT_PREFIX}${transformedCount++}`] = {
                    value: v.value,
                    field
                };
            } else {
                metadata[field] = v.value;
            }
        }
        return {
            value: metadata,
            transformed: false,
        };
    }

    if (Array.isArray(value)) {
        let transformed = false;
        const values = value
            .map(_convertValueToJSON)
            .map((v) => {
                if (v.transformed) transformed = true;
                return v.value;
            });
        return {
            value: values,
            transformed,
        };
    }

    return { value, transformed: false };
}

/**
 * Converts the Metadata from JSON compatible objects
 * so it can be serialized
*/
export function convertMetadataFromJSON(
    input: Record<string, unknown>
): Record<string, unknown> {
    return _convertValueFromJSON(input) as Record<string, unknown>;
}

function _convertValueFromJSON(value: unknown): unknown {
    if (isPlainObject(value)) {
        const metadata: Record<string, unknown> = Object.create(null);
        const entries = Object.entries(value as Record<string, unknown>);
        for (const [field, nestedValue] of entries) {
            if (field.startsWith(BIG_INT_PREFIX)) {
                const { field: ogField, value: transformed } = nestedValue as any;
                metadata[ogField] = Array.isArray(transformed)
                    ? transformed.map(toBigInt)
                    : toBigInt(transformed);
            } else {
                metadata[field] = _convertValueFromJSON(nestedValue);
            }
        }
        return metadata;
    }

    if (Array.isArray(value)) {
        return value.map(_convertValueFromJSON);
    }

    return value;
}
