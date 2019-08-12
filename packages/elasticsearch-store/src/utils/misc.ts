import * as R from 'rambda';

export const isNotNil = (input: any) => input != null;

export function getFirstValue<T>(input: { [key: string]: T }): T | undefined {
    return Object.values(input)[0];
}
export function getFirstKey<T>(input: T): (keyof T) | undefined {
    return Object.keys(input)[0] as keyof T;
}

export const getIndexMapping = R.path(['index_schema', 'mapping']);

export const getRolloverFrequency = R.pathOr('monthly', ['index_schema', 'rollover_frequency']);

export const getSchemaVersion = R.pathOr(1, ['index_schema', 'version']);
export const getSchemaVersionStr: (config: any) => string = R.pipe(
    getSchemaVersion,
    R.toString as any,
    R.prepend('s')
) as any;

export const getDataVersion = R.pathOr(1, ['version']);
export const getDataVersionStr: (config: any) => string = R.pipe(
    getDataVersion,
    R.toString as any,
    R.prepend('v')
) as any;

export const formatIndexName: (strs: (string | undefined)[]) => string = R.pipe(
    R.reject((v: string) => !v) as any,
    R.map(R.trim),
    R.join('-')
);

export const buildNestPath: (paths: (string | undefined)[]) => string = R.pipe(
    R.reject((v: string) => !v) as any,
    R.map(R.trim),
    R.join('.')
);
