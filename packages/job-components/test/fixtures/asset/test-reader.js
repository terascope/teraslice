function schema() {
    return {
        hello: {
            doc: 'Example prop',
            default: true,
            format: 'Boolean'
        },
    };
}

function newReader() {
    return (data) => data;
}

export default {
    schema,
    newReader,
};
