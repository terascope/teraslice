import {
    get, toIntegerOrThrow, shuffle, range
} from '@terascope/core-utils';
import getPort from 'get-port';
import { Context } from '@terascope/job-components';

export interface PortOptions {
    start?: number;
    end?: number;
    assetsPort?: number;
}

const usedPorts: number[] = [];

/**
 * Return a random open port between start(inclusive) and end(exclusive), excluding usedPorts.
 * If all ports in that range are being used a random port between 1024 and 65535
 * will be returned instead.
 * @param {PortOptions} options Start, end, and assetsPort to exclude
 * @returns {number}
 */
export async function findPort(options: PortOptions = {}) {
    const {
        start = 1024,
        end = 65536,
        assetsPort = 8003
    } = options;

    usedPorts.push(assetsPort);

    const port = await getPort({
        port: shuffle(range(start, end)),
        exclude: usedPorts
    });

    usedPorts.push(port);

    if (port) return port;
    throw new Error(`No available port between ${start}-${end}`);
}

export function getPorts(context: Context) {
    const portConfig = get(context, 'sysconfig.teraslice.slicer_port_range');
    const dataArray = portConfig.split(':', 2);
    const assetsPort = toIntegerOrThrow(dataArray[0]);
    const start = assetsPort + 1;
    // range end is exclusive, so we need to add one
    const end = toIntegerOrThrow(dataArray[1]) + 1;
    return { assetsPort, start, end };
}
