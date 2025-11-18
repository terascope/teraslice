import { get, trim } from '@terascope/core-utils';
import { TimeSeriesFormat } from '../interfaces.js';

export function getRolloverFrequency(config: unknown): TimeSeriesFormat {
    return get(config, ['index_schema', 'rollover_frequency'], 'monthly');
}

export function getSchemaVersion(config: unknown): number {
    return get(config, ['index_schema', 'version'], 1);
}

export function getSchemaVersionStr(config: unknown): string {
    return `s${getSchemaVersion(config)}`;
}

export function getDataVersion(config: unknown): number {
    return get(config, ['version'], 1);
}

export function getDataVersionStr(config: unknown): string {
    return `v${getDataVersion(config)}`;
}

export function formatIndexName(strs: (string | undefined)[]): string {
    return strs.map((val) => trim(val)).filter(Boolean)
        .join('-');
}
