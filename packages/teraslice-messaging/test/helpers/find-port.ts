import getPort from 'get-port';

const usedPorts: number[] = [];

export default async function findPort(): Promise<number> {
    // getPort will return an open port between 1024 and 65535, excluding usedPorts
    const port = await getPort({ exclude: usedPorts });

    usedPorts.push(port);
    return port;
}
