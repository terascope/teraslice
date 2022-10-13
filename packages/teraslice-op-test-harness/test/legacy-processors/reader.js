
export async function newReader(context) {
    const clientConfig = { type: 'elasticsearch', endpoint: 'default', cached: true };
    const { client } = context.foundation.getConnection(clientConfig);
    return async (data) => {
        data.wasRead = true;
        return client.get(data);
    };
}

export async function newSlicer(context) {
    const clientConfig = { type: 'elasticsearch', endpoint: 'default', cached: true };
    const { client } = context.foundation.getConnection(clientConfig);
    return [async () => {
        const slice = { now: new Date() };
        return client.count(slice);
    }];
}

export function schema() {
    return {
        config: {
            doc: 'some random test config',
            format: String,
            default: 'config'
        }
    };
}
