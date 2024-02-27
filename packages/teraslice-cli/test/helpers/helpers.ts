import { v4 as uuidV4 } from 'uuid';
import path from 'path';
import { Teraslice } from '@terascope/types';
import Config from '../../src/helpers/config';

export function makeJobIds(n: number): string[] {
    return [...new Array(n)].map(() => uuidV4());
}

export function getJobExecution(jobId: string) {
    return {
        active: true,
        analytics: true,
        performance_metrics: false,
        assets: [
            '35c4b4a3ae68c422d8fd98f1228cd461d2087c1c',
            '4bb1c4e6fa29c74de2a97b5b9d0f20a7ce6745b2'
        ],
        autorecover: false,
        lifecycle: 'persistent',
        max_retries: 3,
        name: 'test-job',
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
        apis: [],
        probation_window: 300000,
        slicers: 1,
        workers: 2,
        stateful: false,
        labels: null,
        env_vars: {},
        ephemeral_storage: false,
        pod_spec_override: {},
        volumes: [],
        _created: new Date().toISOString(),
        job_id: jobId,
        _context: 'ex',
        _updated: new Date().toISOString(),
        ex_id: jobId,
        metadata: {},
        _status: 'running',
        _has_errors: false,
        _slicer_stats: {},
        _failureReason: '',
        slicer_port: 45680,
        slicer_hostname: '10.33.194.86'
    };
}

export function clusterControllers(jobIds: string[]): Teraslice.ExecutionList {
    return jobIds.map((id) => {
        const slicerStats: Teraslice.ExecutionAnalyticsResponse = {
            ex_id: `${id}-ex-id`,
            job_id: id,
            processed: Math.round(Math.random() * 100),
            failed: 0,
            queued: Math.round(Math.random() * 100),
            subslices: 0,
            slice_range_expansion: 0,
            subslice_by_key: 0,
            started: new Date().toISOString(),
            job_duration: 10000,
            name: 'test-job',
            workers_joined: 5,
            workers_disconnected: 0,
            workers_reconnected: 0,
            workers_available: 0,
            workers_active: 2,
            slicers: 1,
            queuing_complete: ''
        };

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
