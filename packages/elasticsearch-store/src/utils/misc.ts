import * as ts from '@terascope/utils';
import { TimeSeriesFormat } from '../interfaces';

export function getRolloverFrequency(config: any): TimeSeriesFormat {
    return ts.get(config, ['index_schema', 'rollover_frequency'], 'monthly');
}

export function getSchemaVersion(config: any): number {
    return ts.get(config, ['index_schema', 'version'], 1);
}

export function getSchemaVersionStr(config: any): string {
    return `s${getSchemaVersion(config)}`;
}

export function getDataVersion(config: any): number {
    return ts.get(config, ['version'], 1);
}

export function getDataVersionStr(config: any): string {
    return `v${getDataVersion(config)}`;
}

export function formatIndexName(strs: (string | undefined)[]): string {
    return strs.map(ts.trim).filter(Boolean).join('-');
}
