import * as R from 'rambda';

export const isNotNil = (input: any) => input != null;

type getFirstFn = <T>(input: object) => T;

export const getFirstValue: getFirstFn = R.pipe(
    // @ts-ignore
    R.values,
    R.head
);

export const getFirstKey: getFirstFn = R.pipe(
    // @ts-ignore
    R.keys,
    R.head
);

export const getIndexMapping = R.path(['indexSchema', 'mapping']);

export const getRolloverFrequency = R.pathOr('monthly', ['indexSchema', 'rollover_frequency']);

export const getSchemaVersion = R.pathOr(1, ['indexSchema', 'version']);
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
