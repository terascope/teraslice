import { castConfig, CastArgs } from './cast';
import { parseJSONConfig } from './parseJSON';
import { setDefaultConfig, SetDefaultArgs } from './setDefault';
import { toJSONConfig } from './toJSON';

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
