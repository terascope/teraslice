import 'jest-extended';
import Display from '../../src/helpers/display';

const display = new Display();

describe('display', () => {
    test('should parse response into an array', async () => {
        const header = ['name', 'job_id', 'ex_id', '_status'];
        const response = [
            {
                analytics: true,
                assets: null,
                lifecycle: 'once',
                max_retries: 3,
                name: 'test-job-1',
                operations: [[Object], [Object]],
                probation_window: 300000,
                slicers: 1,
                workers: 5,
                targets: [],
                cpu: -1,
                memory: -1,
                volumes: [],
                job_id: 'a9999999-9999-9999-9999-999999999999',
                _context: 'ex',
                _created: '2019-01-01T00:00:00.000Z',
                _updated: '2019-01-01T00:00:01.000Z',
                ex_id: 'a9999999-9999-9999-9999-999999999998',
                _status: 'failed',
                slicer_hostname:
                    'teraslice-execution-controller-a9999999-9999-9999-9999-999999999999',
                slicer_port: 45680,
                _has_errors: true,
                _failureReason: 'error',
                _slicer_stats: {
                    workers_active: 0,
                    workers_joined: 0,
                    queued: 0,
                    job_duration: 0,
                    subslice_by_key: 0,
                    started: '2019-01-01T00:00:00.000Z',
                    failed: 0,
                    subslices: 0,
                    queuing_complete: '',
                    slice_range_expansion: 0,
                    processed: 0,
                    workers_available: 0,
                    workers_reconnected: 0,
                    workers_disconnected: 0
                }
            },
            {
                analytics: true,
                assets: null,
                lifecycle: 'once',
                max_retries: 3,
                name: 'test-job-2',
                operations: [[Object], [Object]],
                probation_window: 300000,
                slicers: 1,
                workers: 5,
                targets: [],
                cpu: -1,
                memory: -1,
                volumes: [],
                job_id: 'b9999999-9999-9999-9999-999999999999',
                _context: 'ex',
                _created: '2019-01-01T00:00:00.000Z',
                _updated: '2019-01-01T00:00:01.000Z',
                ex_id: 'b9999999-9999-9999-9999-999999999997',
                _status: 'failed',
                slicer_hostname:
                    'teraslice-execution-controller-b9999999-9999-9999-9999-999999999999',
                slicer_port: 45680,
                _has_errors: true,
                _failureReason: 'error',
                _slicer_stats: {
                    workers_active: 1,
                    workers_joined: 9,
                    queued: 0,
                    job_duration: 1087497,
                    subslice_by_key: 0,
                    started: '2019-01-01T00:00:01.000Z',
                    failed: 4,
                    subslices: 0,
                    slice_range_expansion: 0,
                    processed: 1000000,
                    workers_available: 4,
                    workers_reconnected: 0,
                    workers_disconnected: 0,
                    slicers: 1,
                    queuing_complete: '2019-01-01T00:00:01.000Z'
                }
            },
            {
                name: 'test-job-3',
                lifecycle: 'once',
                workers: 5,
                operations: [[Object], [Object]],
                job_id: 'c9999999-9999-9999-9999-999999999999',
                _context: 'ex',
                _created: '2019-01-01T00:00:00.000Z',
                _updated: '2019-01-01T00:00:01.000Z',
                analytics: true,
                assets: null,
                max_retries: 3,
                probation_window: 300000,
                slicers: 1,
                targets: [],
                cpu: -1,
                memory: -1,
                volumes: [],
                ex_id: 'c9999999-9999-9999-9999-999999999996',
                _status: 'failed'
            }
        ];
        const result = await display.parseResponse(header, response, false);
        expect(result[0][0]).toEqual('test-job-1');
        expect(result[0][1]).toEqual('a9999999-9999-9999-9999-999999999999');
        expect(result[0][2]).toEqual('a9999999-9999-9999-9999-999999999998');
        expect(result[0][3]).toEqual('failed');
        expect(result[1][0]).toEqual('test-job-2');
        expect(result[1][1]).toEqual('b9999999-9999-9999-9999-999999999999');
        expect(result[1][2]).toEqual('b9999999-9999-9999-9999-999999999997');
        expect(result[1][3]).toEqual('failed');
        expect(result[2][0]).toEqual('test-job-3');
        expect(result[2][1]).toEqual('c9999999-9999-9999-9999-999999999999');
        expect(result[2][2]).toEqual('c9999999-9999-9999-9999-999999999996');
        expect(result[2][3]).toEqual('failed');
        expect(result.length).toEqual(3);
        expect(result).toBeArray();
    });

    test('should parse response into an array when active is true', async () => {
        const header = [
            'assignment',
            'job_id',
            'ex_id',
            'node_id',
            'worker_id',
            'teraslice_version'
        ];
        const response = {
            '10.10.10.1': {
                node_id: '10.10.10.1',
                hostname: '10.10.10.1',
                pid: 'N/A',
                node_version: 'v8.12.0',
                teraslice_version: '0.46.2',
                total: 'N/A',
                state: 'connected',
                available: 'N/A',
                active: [
                    {
                        worker_id: 'teraslice-worker-1',
                        assignment: 'worker',
                        pid: 'teraslice-worker-0000001',
                        ex_id: '000001',
                        job_id: '0000002',
                        pod_ip: '192.1.1.1',
                        assets: []
                    }
                ]
            },
            '10.10.10.2': {
                node_id: '10.10.10.2',
                hostname: '10.10.10.2',
                pid: 'N/A',
                node_version: 'v8.12.0',
                teraslice_version: '0.46.2',
                total: 'N/A',
                state: 'connected',
                available: 'N/A',
                active: [
                    {
                        worker_id: 'teraslice-worker-2',
                        assignment: 'worker',
                        pid: 'teraslice-worker-0000002',
                        ex_id: '000002',
                        job_id: '0000003',
                        pod_ip: '192.1.1.2',
                        assets: []
                    }
                ]
            },
            '10.10.10.3': {
                node_id: '10.10.10.3',
                hostname: '10.10.10.3',
                pid: 'N/A',
                node_version: 'v8.12.0',
                teraslice_version: '0.46.2',
                total: 'N/A',
                state: 'connected',
                available: 'N/A',
                active: [
                    {
                        worker_id: 'teraslice-worker-3',
                        assignment: 'worker',
                        pid: 'teraslice-worker-0000003',
                        ex_id: '000003',
                        job_id: '0000004',
                        pod_ip: '192.1.1.3',
                        assets: []
                    }
                ]
            }
        };
        const id = '0000004';
        const result = await display.parseResponse(header, response, true, id);
        expect(result[0][0]).toEqual('worker');
        expect(result[0][1]).toEqual('0000004');
        expect(result[0][2]).toEqual('000003');
        expect(result[0][3]).toEqual('10.10.10.3');
        expect(result[0][4]).toEqual('teraslice-worker-3');
        expect(result[0][5]).toEqual('0.46.2');
        expect(result.length).toEqual(1);
        expect(result).toBeArray();
    });

    test('should parse state response into an array when id is not defined', async () => {
        const header = [
            'assignment',
            'job_id',
            'ex_id',
            'node_id',
            'worker_id',
            'teraslice_version',
            'node_version',
            'hostname'
        ];
        const response = {
            '10.10.10.1': {
                node_id: '10.10.10.1',
                hostname: '10.10.10.1',
                pid: 'N/A',
                node_version: 'v8.12.0',
                teraslice_version: '0.46.2',
                total: 'N/A',
                state: 'connected',
                available: 'N/A',
                active: [
                    {
                        worker_id: 'teraslice-worker-1',
                        assignment: 'worker',
                        pid: 'teraslice-worker-0000001',
                        ex_id: '000001',
                        job_id: '0000002',
                        pod_ip: '192.1.1.1',
                        assets: []
                    }
                ]
            },
            '10.10.10.2': {
                node_id: '10.10.10.2',
                hostname: '10.10.10.2',
                pid: 'N/A',
                node_version: 'v8.12.0',
                teraslice_version: '0.46.2',
                total: 'N/A',
                state: 'connected',
                available: 'N/A',
                active: [
                    {
                        worker_id: 'teraslice-worker-2',
                        assignment: 'worker',
                        pid: 'teraslice-worker-0000002',
                        ex_id: '000002',
                        job_id: '0000003',
                        pod_ip: '192.1.1.2',
                        assets: []
                    }
                ]
            },
            '10.10.10.3': {
                node_id: '10.10.10.3',
                hostname: '10.10.10.3',
                pid: 'N/A',
                node_version: 'v8.12.0',
                teraslice_version: '0.46.2',
                total: 'N/A',
                state: 'connected',
                available: 'N/A',
                active: [
                    {
                        worker_id: 'teraslice-worker-3',
                        assignment: 'worker',
                        pid: 'teraslice-worker-0000003',
                        ex_id: '000003',
                        job_id: '0000004',
                        pod_ip: '192.1.1.3',
                        assets: []
                    }
                ]
            }
        };
        const result = await display.parseResponse(header, response, true);
        expect(result[0][0]).toEqual('worker');
        expect(result[0][1]).toEqual('0000002');
        expect(result[0][2]).toEqual('000001');
        expect(result[0][3]).toEqual('10.10.10.1');
        expect(result[0][4]).toEqual('teraslice-worker-1');
        expect(result[0][5]).toEqual('0.46.2');
        expect(result[0][0]).toEqual('worker');
        expect(result[1][1]).toEqual('0000003');
        expect(result[1][2]).toEqual('000002');
        expect(result[1][3]).toEqual('10.10.10.2');
        expect(result[1][4]).toEqual('teraslice-worker-2');
        expect(result[1][5]).toEqual('0.46.2');
        expect(result[2][0]).toEqual('worker');
        expect(result[2][1]).toEqual('0000004');
        expect(result[2][2]).toEqual('000003');
        expect(result[2][3]).toEqual('10.10.10.3');
        expect(result[2][4]).toEqual('teraslice-worker-3');
        expect(result[2][5]).toEqual('0.46.2');
        expect(result[2][6]).toEqual('v8.12.0');
        expect(result[2][7]).toEqual('10.10.10.3');
        expect(result.length).toEqual(3);
        expect(result).toBeArray();
    });
});
