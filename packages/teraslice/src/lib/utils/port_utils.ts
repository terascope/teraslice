import {
    get, times, pDelay,
    toIntegerOrThrow, shuffle
} from '@terascope/utils';
import porty from 'porty';
import { Context } from '@terascope/job-components';

const _portLists = new Map();

function listPorts(start: number, end: number): number[] {
    const key = `${start}:${end}`;
    if (_portLists.has(key)) {
        return _portLists.get(key);
    }

    // this should only be done once
    const ports = shuffle(times((end - start) + 1, (n) => n + start));
    _portLists.set(key, ports);
    return ports;
}

export interface PortOptions {
    start?: number;
    end?: number;
    assetsPort?: number;
}

export async function findPort(options: PortOptions = {}) {
    // If using this function within a test file, avoid port collisions by
    // setting PortOptions start and end to a range not used by other tests.
    const {
        start = 8002,
        end = 40000,
        assetsPort = 8003
    } = options;

    const ports = listPorts(start, end);

    const tested: number[] = [];
    let port: number | undefined;

    while (ports.length) {
        port = ports.shift() as number;
        if (port === assetsPort) continue;
        // these will be enqueue
        tested.push(port);

        const available = await porty.test(port);
        if (available) {
            break;
        } else {
            await pDelay(100);
            port = undefined;
        }
    }

    _portLists[`${start}:${end}`] = ports.concat(tested);

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
