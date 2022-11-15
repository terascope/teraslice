// Add a field with static value `foo`.

export function newProcessor(context, opConfig) {
    return function process(data) {
        const results = [];
        data.forEach((obj) => {
            obj[opConfig.field] = 'foo';
            results.push(obj);
        });
        return results;
    };
}

export function schema() {
    return {
        field: {
            doc: 'Name of field to foo up.',
            default: 'foo',
            format: 'optional_String'
        }
    };
}
