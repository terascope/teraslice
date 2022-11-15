import { castConfig, CastArgs } from './cast.js';
import { parseJSONConfig } from './parseJSON.js';
import { setDefaultConfig, SetDefaultArgs } from './setDefault.js';
import { toJSONConfig } from './toJSON.js';

export const jsonRepository = {
    cast: castConfig,
    parseJSON: parseJSONConfig,
    setDefault: setDefaultConfig,
    toJSON: toJSONConfig
};

export type {
    CastArgs,
    SetDefaultArgs
};
