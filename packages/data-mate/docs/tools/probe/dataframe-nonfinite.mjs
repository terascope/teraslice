/* eslint-disable no-console -- a probe's output IS its result */
// A non-finite number is NOT nil to DataFrame (FloatVector has no toJSONCompatibleValue), so its
// key survives null removal and JSON.stringify writes null. Confirm, per preset and per position.
import { DataFrame } from '../../../dist/src/index.js';
import { FieldType as T } from '@terascope/types';

const PRESETS = {
    default: {
        useNullForUndefined: false,
        skipNilValues: true,
        skipEmptyObjects: true,
        skipNilObjectValues: true,
        skipDuplicateObjects: false,
    },
    preserve: {
        useNullForUndefined: true,
        skipNilValues: false,
        skipEmptyObjects: false,
        skipNilObjectValues: true,
        skipDuplicateObjects: false,
    },
};
const config = {
    version: 1,
    fields: {
        f: { type: T.Double },
        obj: { type: T.Object },
        'obj.g': { type: T.Double },
        list: { type: T.Double, array: true },
    },
};
const records = [{ f: Number.NaN, obj: { g: Infinity }, list: [1, Number.NaN] }, { f: Number.NaN }];
for (const [name, opts] of Object.entries(PRESETS)) {
    const lines = DataFrame.fromJSON(config, records).toJSON(opts)
        .map((r) => JSON.stringify(r));
    console.log(name.padEnd(9), lines.join('  '));
}
