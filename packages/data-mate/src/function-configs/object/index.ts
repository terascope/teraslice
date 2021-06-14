import { equalsConfig, EqualsArgs } from './equals';
import { isEmptyConfig, EmptyArgs } from './isEmpty';
import { lookupConfig, LookupArgs } from './lookup';

export const objectRepository = {
    equals: equalsConfig,
    isEmpty: isEmptyConfig,
    lookup: lookupConfig
};

export type {
    EqualsArgs,
    EmptyArgs,
    LookupArgs
};
