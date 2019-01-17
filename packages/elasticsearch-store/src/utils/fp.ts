import * as R from 'rambda';
import * as es from 'elasticsearch';
import * as i from './interfaces';

export const isNotNil = (input: any) => input != null;

export function getTimeByField(field: string = ''): (input: any) => number {
    return R.ifElse(
        R.has(field),
        R.pipe(R.path(field), (input: any) => new Date(input).getTime()),
        () => Date.now()
    );
}

export const getErrorMessage: (error: i.ErrorLike) => string = R.pipe(
    R.ifElse(
        R.has('message'),
        R.path('message'),
        R.path('msg'),
    ),
    R.defaultTo('Unknown Error'),
);

export const getErrorMessages: (errors: i.ErrorLike[]) => string = R.pipe(
    // @ts-ignore
    R.map(getErrorMessage),
    R.join(', '),
);

export const getErrorType = R.pathOr('', ['error', 'type']);

export const getStatusCode: (error: i.ErrorLike) => number = R.pipe(
    R.ifElse(
        R.has('statusCode'),
        R.path('statusCode'),
        R.path('status')
    ),
    R.defaultTo(500)
);

type Shard = { primary: boolean, stage: string };

export function shardsPath(index: string): (stats: any) => Shard[] {
    return R.pathOr([], [index, 'shards']);
}

export const verifyIndexShards: (shards: Shard[]) => boolean = R.pipe(
    // @ts-ignore
    R.filter((shard: Shard) => shard.primary),
    R.all((shard: Shard) => shard.stage === 'DONE')
);

export const getRolloverFrequency = R.pathOr('monthly', ['indexSchema', 'rollover_frequency']);

type indexFn = (config?: i.IndexSchema) => boolean;

export const isSimpleIndex: indexFn = R.both(
    isNotNil,
    R.both(
        R.has('mapping'),
        R.pipe(R.path('template'), R.isNil)
    )
);

export const isTemplatedIndex: indexFn = R.both(
    isNotNil,
    R.both(
        R.has('mapping'),
        R.propEq('template', true),
    )
);

export const isTimeSeriesIndex: indexFn = R.both(
    isTemplatedIndex,
    R.propEq('timeseries', true)
);

export function isValidClient(input: any): input is es.Client {
    if (input == null) return false;

    const reqKeys = [
        'indices',
        'index',
        'get',
        'search',
    ];

    return reqKeys.every((key) => input[key] != null);
}
