function schema() {
    return {
        hello: {
            doc: 'Example prop',
            default: true,
            format: 'Boolean'
        },
    };
}

function newProcessor() {
    return (data) => data;
}

export default {
    schema,
    newProcessor,
};
