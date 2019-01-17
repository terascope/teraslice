import * as R from 'rambda';

export function getTimeByField(field: string = ''): (input: any) => number {
    return R.ifElse(
        R.has(field),
        R.pipe(R.path(field), (input: any) => new Date(input).getTime()),
        () => Date.now()
    );
}
