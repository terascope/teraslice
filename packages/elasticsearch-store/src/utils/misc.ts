import * as R from 'rambda';

export const isNotNil = (input: any) => input != null;

export const getFirstValue: <T>(input: object[]) => T = R.pipe(
    // @ts-ignore
    R.values,
    R.head,
);

export const getFirstKey: <T>(input: object[]) => T = R.pipe(
    // @ts-ignore
    R.keys,
    R.head,
);

export const getIndexMapping = R.path('indexSchema.mapping');

export const getRolloverFrequency = R.pathOr('monthly', [
    'indexSchema',
    'rollover_frequency'
]);

export const getSchemaVersion = R.pathOr(1, ['indexSchema', 'version']);
export const getDataVersion = R.pathOr(1, ['version']);
