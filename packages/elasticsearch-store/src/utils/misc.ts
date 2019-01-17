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
