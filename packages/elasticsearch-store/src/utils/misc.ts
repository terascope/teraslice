import * as ts from '@terascope/utils';
import { TimeSeriesFormat } from '../interfaces.js';

export function getRolloverFrequency(config: unknown): TimeSeriesFormat {
    return ts.get(config, ['index_schema', 'rollover_frequency'], 'monthly');
}

export function getSchemaVersion(config: unknown): number {
    return ts.get(config, ['index_schema', 'version'], 1);
}

export function getSchemaVersionStr(config: unknown): string {
    return `s${getSchemaVersion(config)}`;
}

export function getDataVersion(config: unknown): number {
    return ts.get(config, ['version'], 1);
}

export function getDataVersionStr(config: unknown): string {
    return `v${getDataVersion(config)}`;
}

export function formatIndexName(strs: (string | undefined)[]): string {
    return strs.map((val) => ts.trim(val)).filter(Boolean).join('-');
}
