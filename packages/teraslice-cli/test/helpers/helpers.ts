import { v4 as uuidV4 } from 'uuid';
import path from 'path';
import { ControllerState, SlicerStats } from 'teraslice-client-js';
import Config from '../../src/helpers/config';

export function makeJobIds(n: number): string[] {
    return [...new Array(n)].map(() => uuidV4());
}

export function clusterControllers(jobIds: string[]): ControllerState {
    return jobIds.map((id) => {
        const slicerStats = {
            ex_id: `${id}-ex-id`,
            job_id: id,
            processed: Math.round(Math.random() * 100),
            failed: 0,
            queued: Math.round(Math.random() * 100),
            job_duration: 10000,
            name: 'test-job',
            workers_joined: 5,
            workers_disconnected: 0,
            workers_reconnected: 0,
            workers_available: 0,
            workers_active: 2,
            slicers: 1,
            queuing_complete: ''
        } as unknown as SlicerStats;

        return slicerStats;
    });
}

export function testJobConfig(id: string) {
    return {
        name: 'test-job',
        lifecycle: 'persistent',
        workers: 1,
        assets: [
            'asset1:2.7.4',
            'asset2:0.14.1'
        ],
        operations: [
            {
                _op: 'read_data',
                start: '2020-01-01',
                format: 'isoBetween',
                size: 100000
            },
            {
                _op: 'noop'
            }
        ],
        _created: '2021-08-25T19:49:55.956Z',
        job_id: id,
        _context: 'job',
        _updated: '2023-06-21T21:14:14.208Z'
    };
}

export function buildCLIConfig(action: string, overwrite = {}) {
    let testArgs = {
        _: ['jobs', action],
        'config-dir': path.join(__dirname, '..', 'fixtures', 'job_saves'),
        d: path.join(__dirname, '..', 'fixtures', 'job_saves'),
        configDir: path.join(__dirname, '..', 'fixtures', 'job_saves'),
        output: 'txt',
        o: 'txt',
        status: [],
        yes: false,
        y: false,
        $0: '/usr/local/bin/earl',
        'cluster-alias': 'testerTest',
        clusterAlias: 'testerTest'
    };

    testArgs = Object.assign(testArgs, overwrite);

    return new Config(testArgs);
}
