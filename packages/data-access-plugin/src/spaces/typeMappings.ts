
// TODO: figure out object and array type mappings

const numberMapping = {
    long: 'Int',
    integer: 'Int',
    short: 'Int',
    byte: 'Int',
    double: 'Int',
    float: 'Int',
    half_float: 'Int',
};

const textMapping = {
    text: 'String',
    keyword: 'String',
};

// TODO: need to deal with number dates
const dateMapping = {
    date: 'DateTime',
};

const geoMapping = {
    geo_point: 'String',
    geo_shape: 'String',
    geo: 'String'
};

const booleanMapping = {
    boolean: 'boolean'
};

const ipMapping = {
    ip: 'String',
};

const allTypeMappings = {
    ...numberMapping,
    ...textMapping,
    ...dateMapping,
    ...geoMapping,
    ...booleanMapping,
    ...ipMapping,
};

export default allTypeMappings;
