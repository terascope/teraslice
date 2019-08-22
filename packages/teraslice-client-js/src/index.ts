
import TerasliceClient from './lib';

// we don't want to break the existing api by forcing the client to be called with new
// @ts-ignore

export default function createTerasliceClient(config) {
    return new TerasliceClient(config);
}
