import { parseJSONConfig } from './parseJSON';
import { setDefaultConfig } from './setDefault';
import { toJSONConfig } from './toJSON';

export const jsonRepository = {
    parseJSON: parseJSONConfig,
    setDefault: setDefaultConfig,
    toJSON: toJSONConfig
};
