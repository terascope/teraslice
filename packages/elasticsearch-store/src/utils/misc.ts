import * as R from 'rambda';

export const isNotNil = (input: any) => input != null;

type getFirstFn = <T>(input: object) => T;

export const getFirstValue: getFirstFn = R.pipe(
    // @ts-ignore
    R.values,
    R.head,
);

export const getFirstKey: getFirstFn = R.pipe(
    // @ts-ignore
    R.keys,
    R.head,
);

export const getIndexMapping = R.path('indexSchema.mapping');

export const getRolloverFrequency = R.pathOr('monthly', 'indexSchema.rollover_frequency');

export const getSchemaVersion = R.pathOr(1, 'indexSchema.version');
export const getSchemaVersionStr = R.pipe(
    getSchemaVersion,
    // @ts-ignore
    R.toString,
    R.prepend('s')
);

export const getDataVersion = R.pathOr(1, 'version');
export const getDataVersionStr = R.pipe(
    getDataVersion,
    // @ts-ignore
    R.toString,
    R.prepend('v')
);

export const formatIndexName: (strs: string[]) => string = R.pipe(
    R.reject((v: string) => !v),
    // @ts-ignore
    R.map(R.trim),
    R.join('-')
);

export const buildNestPath: (paths: string[]) => string = R.pipe(
    R.reject((v: string) => !v),
    // @ts-ignore
    R.map(R.trim),
    R.join('.')
);
