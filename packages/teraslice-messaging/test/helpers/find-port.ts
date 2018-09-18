// @ts-ignore
import porty from 'porty';
import random from 'lodash/random';

const usedPorts: number[] = [];

export default async function findPort(): Promise<number> {
    const min = random(8000, 40000);
    const max = min + 100;

    const port = await porty.find({
        min,
        max,
        avoids: usedPorts,
    });

    usedPorts.push(port);

    return port;
}
