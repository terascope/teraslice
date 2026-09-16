import { xLuceneFieldType, xLuceneTypeConfig } from '@terascope/types';

/** One type config for every emission case, so a case only has to name its query. */
export const typeConfig: xLuceneTypeConfig = {
    bar: xLuceneFieldType.String,
    baz: xLuceneFieldType.String,
    bool: xLuceneFieldType.Boolean,
    num: xLuceneFieldType.Integer,
    date: xLuceneFieldType.Date,
    ip: xLuceneFieldType.IP,
    ipRange: xLuceneFieldType.IPRange,
    location: xLuceneFieldType.GeoPoint,
    geoShape: xLuceneFieldType.GeoJSON,
    nested: xLuceneFieldType.Object,
    'nested.name': xLuceneFieldType.String,
};
