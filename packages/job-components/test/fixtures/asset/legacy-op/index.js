function newProcessor(context, opConfig) {
    return function processor(data) {
        data.forEach((doc) => {
            doc[opConfig.destination] = Math.random();
        });

        return data;
    };
}

function schema() {
    return {
        destination: {
            doc: 'The property to copy to',
            format: 'String',
            default: 'dest'
        }
    };
}

export default {
    newProcessor,
    schema,
};
