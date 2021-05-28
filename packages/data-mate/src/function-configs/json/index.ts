import { parseJSONConfig } from './parseJSON';
import { setDefaultConfig, SetDefaultArgs } from './setDefault';
import { toJSONConfig } from './toJSON';

export const jsonRepository = {
    parseJSON: parseJSONConfig,
    setDefault: setDefaultConfig,
    toJSON: toJSONConfig
};

export type {
    SetDefaultArgs
};
