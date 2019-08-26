
import Client from './lib';
import * as ts from './interfaces';
export * from './interfaces';

function TerasliceClient(config: ts.ClientConfig): Client {
    return new Client(config);
}

export { TerasliceClient };
export { Client };
export default TerasliceClient;
