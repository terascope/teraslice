export function newProcessor() {
    return (data: any[]) => data.map(() => 'hello');
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
