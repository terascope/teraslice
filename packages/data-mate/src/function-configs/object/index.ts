import { equalsConfig, EqualsArgs } from './equals.js';
import { isEmptyConfig, EmptyArgs } from './isEmpty.js';
import { lookupConfig, LookupArgs } from './lookup.js';

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
