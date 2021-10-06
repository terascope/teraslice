import type { DataFrame } from '../DataFrame';

export interface MatchRowFn {
    (dataFrame: DataFrame<Record<string, unknown>>, rowIndex: number): boolean
}

export interface MatchValueFn {
    (value: unknown): boolean
}
