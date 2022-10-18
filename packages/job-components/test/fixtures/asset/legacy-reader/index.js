function newSlicer() {
    return function slicer() {
        return { id: Math.random() };
    };
}

function newReader(_context, opConfig) {
    return function _reader(data) {
        data.stuff = opConfig.example;
        return [data];
    };
}

const schema = {
    example: {
        default: 'i am a legacy reader',
        doc: 'A random example schema property',
        format: 'String',
    }
};

export default {
    newSlicer,
    newReader,
    schema
};
