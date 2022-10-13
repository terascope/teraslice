export function newReader() {
    return () => Array(100).fill('howdy');
}

export function newSlicer() {
    return () => Array(100).fill('sliced-data');
}

export function schema() {
    return {
        exampleProp: {
            doc: 'Specify some example configuration',
            default: 0,
            format: 'nat'
        }
    };
}
