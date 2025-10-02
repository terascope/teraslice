import 'jest-extended';
import { debugLogger } from '@terascope/utils';
import got from 'got';
import {
    Counter, Gauge, Histogram, Summary
} from 'prom-client';
import api from '../../src/api/index.js';

describe('promMetrics foundation API', () => {
    describe('init', () => {
        describe('with prom metrics enabled in terafoundation', () => {
            describe('with enable_prom_metrics undefined in jobConfig', () => {
                const context = {
                    sysconfig: {
                        terafoundation: {
                            log_level: 'debug',
                            prom_metrics_enabled: true,
                            prom_metrics_port: 3333,
                            prom_metrics_add_default: true,
                            prom_metrics_display_url: 'http://localhost'
                        },
                        teraslice: {
                            cluster_manager_type: 'kubernetesV2',
                            name: 'tera-test'
                        }
                    },
                } as any;

                const { terafoundation, teraslice } = context.sysconfig;
                const config = {
                    terasliceName: teraslice.name,
                    tf_prom_metrics_enabled: terafoundation.prom_metrics_enabled,
                    tf_prom_metrics_port: terafoundation.prom_metrics_port,
                    tf_prom_metrics_add_default: terafoundation.prom_metrics_add_default,
                    logger: debugLogger('prom-metrics-spec-logger'),
                    assignment: 'worker',
                    prom_metrics_display_url: terafoundation.prom_metrics_display_url
                };

                beforeAll(() => {
                    // This sets up the API endpoints in the context.
                    api(context);
                    context.logger = debugLogger('terafoundation-tests');
                });

                afterAll(async () => {
                    await context.apis.foundation.promMetrics.shutdown();
                });

                it('should initialize a promMetricsAPI', async () => {
                    const result = await context.apis.foundation.promMetrics.init(config);
                    expect(result).toBe(true);
                });

                it('should be able to verifyApi', async () => {
                    const apiExists = await context.apis.foundation.promMetrics.verifyAPI();
                    expect(apiExists).toBe(true);
                });

                it('should have correct default labels', async () => {
                    const labels = await context.apis.foundation.promMetrics.getDefaultLabels();
                    expect(labels).toEqual({ name: 'tera-test', url: 'http://localhost' });
                });

                it('should throw an error if promMetricsAPI is already initialized', async () => {
                    await expect(() => context.apis.foundation.promMetrics.init(config))
                        .rejects.toThrow('Prom metrics API cannot be initialized more than once.');
                });
            });

            describe('with prom metrics disabled in jobConfig', () => {
                const context = {
                    sysconfig: {
                        terafoundation: {
                            log_level: 'debug',
                            prom_metrics_enabled: true,
                            prom_metrics_port: 3333,
                            prom_metrics_add_default: true
                        },
                        teraslice: {
                            cluster_manager_type: 'kubernetesV2',
                            name: 'tera-test'
                        }
                    },
                } as any;

                const { terafoundation, teraslice } = context.sysconfig;
                const config = {
                    terasliceName: teraslice.name,
                    tf_prom_metrics_enabled: terafoundation.prom_metrics_enabled,
                    tf_prom_metrics_port: terafoundation.prom_metrics_port,
                    tf_prom_metrics_add_default: terafoundation.prom_metrics_add_default,
                    logger: debugLogger('prom-metrics-spec-logger'),
                    assignment: 'worker',
                    job_prom_metrics_enabled: false
                };

                beforeAll(() => {
                    // This sets up the API endpoints in the context.
                    api(context);
                    context.logger = debugLogger('terafoundation-tests');
                });

                afterAll(async () => {
                    await context.apis.foundation.promMetrics.shutdown();
                });

                it('should not initialize a promMetricsAPI', async () => {
                    const result = await context.apis.foundation.promMetrics.init(config);
                    expect(result).toBe(false);
                });
            });

            describe('with prom metrics enabled in jobConfig', () => {
                const context = {
                    sysconfig: {
                        terafoundation: {
                            log_level: 'debug',
                            prom_metrics_enabled: true,
                            prom_metrics_port: 3333,
                            prom_metrics_add_default: true
                        },
                        teraslice: {
                            cluster_manager_type: 'kubernetesV2',
                            name: 'tera-test'
                        }
                    },
                } as any;

                const { terafoundation, teraslice } = context.sysconfig;
                const config = {
                    terasliceName: teraslice.name,
                    tf_prom_metrics_enabled: terafoundation.prom_metrics_enabled,
                    tf_prom_metrics_port: terafoundation.prom_metrics_port,
                    tf_prom_metrics_add_default: terafoundation.prom_metrics_add_default,
                    logger: debugLogger('prom-metrics-spec-logger'),
                    assignment: 'worker',
                    job_prom_metrics_enabled: true
                };

                beforeAll(() => {
                    // This sets up the API endpoints in the context.
                    api(context);
                    context.logger = debugLogger('terafoundation-tests');
                });

                afterAll(async () => {
                    await context.apis.foundation.promMetrics.shutdown();
                });

                it('should initialize a promMetricsAPI', async () => {
                    const result = await context.apis.foundation.promMetrics.init(config);
                    expect(result).toBe(true);
                });

                it('should throw an error if promMetricsAPI is already initialized', async () => {
                    await expect(() => context.apis.foundation.promMetrics.init(config))
                        .rejects.toThrow('Prom metrics API cannot be initialized more than once.');
                });
            });
        });

        describe('with prom metrics disabled in terafoundation', () => {
            describe('with enable_prom_metrics undefined in jobConfig', () => {
                const context = {
                    sysconfig: {
                        terafoundation: {
                            log_level: 'debug',
                            prom_metrics_enabled: false,
                            prom_metrics_port: 3333,
                            prom_metrics_add_default: true
                        },
                        teraslice: {
                            cluster_manager_type: 'kubernetesV2',
                            name: 'tera-test'
                        }
                    },
                } as any;

                const { terafoundation, teraslice } = context.sysconfig;
                const config = {
                    terasliceName: teraslice.name,
                    tf_prom_metrics_enabled: terafoundation.prom_metrics_enabled,
                    tf_prom_metrics_port: terafoundation.prom_metrics_port,
                    tf_prom_metrics_add_default: terafoundation.prom_metrics_add_default,
                    logger: debugLogger('prom-metrics-spec-logger'),
                    assignment: 'worker'
                };

                beforeAll(() => {
                    // This sets up the API endpoints in the context.
                    api(context);
                    context.logger = debugLogger('terafoundation-tests');
                });

                afterAll(async () => {
                    await context.apis.foundation.promMetrics.shutdown();
                });

                it('should not initialize a promMetricsAPI', async () => {
                    const result = await context.apis.foundation.promMetrics.init(config);
                    expect(result).toBe(false);
                });
            });

            describe('with prom metrics disabled in jobConfig', () => {
                const context = {
                    sysconfig: {
                        terafoundation: {
                            log_level: 'debug',
                            prom_metrics_enabled: false,
                            prom_metrics_port: 3333,
                            prom_metrics_add_default: true
                        },
                        teraslice: {
                            cluster_manager_type: 'kubernetesV2',
                            name: 'tera-test'
                        }
                    },
                } as any;

                const { terafoundation, teraslice } = context.sysconfig;
                const config = {
                    terasliceName: teraslice.name,
                    tf_prom_metrics_enabled: terafoundation.prom_metrics_enabled,
                    tf_prom_metrics_port: terafoundation.prom_metrics_port,
                    tf_prom_metrics_add_default: terafoundation.prom_metrics_add_default,
                    logger: debugLogger('prom-metrics-spec-logger'),
                    assignment: 'worker',
                    job_prom_metrics_enabled: false
                };

                beforeAll(() => {
                    // This sets up the API endpoints in the context.
                    api(context);
                    context.logger = debugLogger('terafoundation-tests');
                });

                afterAll(async () => {
                    await context.apis.foundation.promMetrics.shutdown();
                });

                it('should not initialize a promMetricsAPI', async () => {
                    const result = await context.apis.foundation.promMetrics.init(config);
                    expect(result).toBe(false);
                });
            });

            describe('with prom metrics enabled in jobConfig', () => {
                const context = {
                    sysconfig: {
                        terafoundation: {
                            log_level: 'debug',
                            prom_metrics_enabled: false,
                            prom_metrics_port: 3333,
                            prom_metrics_add_default: true
                        },
                        teraslice: {
                            cluster_manager_type: 'kubernetesV2',
                            name: 'tera-test'
                        }
                    },
                } as any;

                const { terafoundation, teraslice } = context.sysconfig;
                const config = {
                    terasliceName: teraslice.name,
                    tf_prom_metrics_enabled: terafoundation.prom_metrics_enabled,
                    tf_prom_metrics_port: terafoundation.prom_metrics_port,
                    tf_prom_metrics_add_default: terafoundation.prom_metrics_add_default,
                    logger: debugLogger('prom-metrics-spec-logger'),
                    assignment: 'worker',
                    job_prom_metrics_enabled: true
                };

                beforeAll(() => {
                    // This sets up the API endpoints in the context.
                    api(context);
                    context.logger = debugLogger('terafoundation-tests');
                });

                afterAll(async () => {
                    await context.apis.foundation.promMetrics.shutdown();
                });

                it('should initialize a promMetricsAPI', async () => {
                    const result = await context.apis.foundation.promMetrics.init(config);
                    expect(result).toBe(true);
                });

                it('should throw an error if promMetricsAPI is already initialized', async () => {
                    await expect(() => context.apis.foundation.promMetrics.init(config))
                        .rejects.toThrow('Prom metrics API cannot be initialized more than once.');
                });
            });
        });
    });

    describe('counter', () => {
        const context = {
            sysconfig: {
                terafoundation: {
                    log_level: 'debug',
                    prom_metrics_enabled: true,
                    prom_metrics_port: 3334,
                    prom_metrics_add_default: false
                },
                teraslice: {
                    cluster_manager_type: 'kubernetesV2',
                    name: 'tera-test'
                }
            },
        } as any;

        const { terafoundation, teraslice } = context.sysconfig;
        const config = {
            terasliceName: teraslice.name,
            tf_prom_metrics_enabled: terafoundation.prom_metrics_enabled,
            tf_prom_metrics_port: terafoundation.prom_metrics_port,
            tf_prom_metrics_add_default: terafoundation.prom_metrics_add_default,
            logger: debugLogger('prom-metrics-spec-logger'),
            assignment: 'master',
            labels: {},
            prefix: 'foundation_test_'
        };
        beforeAll(async () => {
            // This sets up the API endpoints in the context.
            api(context);
            context.logger = debugLogger('terafoundation-tests');
            await context.apis.foundation.promMetrics.init(config);
        });

        afterAll(async () => {
            await context.apis.foundation.promMetrics.shutdown();
        });

        it('should be able to add a counter', async () => {
            await context.apis.foundation.promMetrics.addCounter('counter1', 'help message', ['uuid'], function collect(this: Counter) {
                const defaultLabels = context.apis.foundation.promMetrics.getDefaultLabels();
                this.inc({ uuid: '5g3kJr', ...defaultLabels }, 34);
            });
            const result = context.apis.foundation.promMetrics.hasMetric('counter1');
            expect(result).toBe(true);
        });

        it('should be able to increment a counter', async () => {
            context.apis.foundation.promMetrics.inc('counter1', { uuid: '5g3kJr' }, 17);
            const response: Record<string, any> = await got(`http://127.0.0.1:${config.tf_prom_metrics_port}/metrics`, {
                throwHttpErrors: true
            });

            const value = response.body
                .split('\n')
                .filter((line: string) => line.includes('5g3kJr'))[0]
                .split(' ')[1];

            expect(value).toBe('51');
        });

        it('should be able to delete a counter', async () => {
            await context.apis.foundation.promMetrics.deleteMetric('counter1');
            expect(context.apis.foundation.promMetrics.hasMetric('counter1')).toBe(false);
        });
    });

    describe('gauge', () => {
        const context = {
            sysconfig: {
                terafoundation: {
                    log_level: 'debug',
                    prom_metrics_enabled: true,
                    prom_metrics_port: 3335,
                    prom_metrics_add_default: true
                },
                teraslice: {
                    cluster_manager_type: 'kubernetesV2',
                    name: 'tera-test'
                }
            },
        } as any;

        const { terafoundation, teraslice } = context.sysconfig;
        const config = {
            terasliceName: teraslice.name,
            tf_prom_metrics_enabled: terafoundation.prom_metrics_enabled,
            tf_prom_metrics_port: terafoundation.prom_metrics_port,
            tf_prom_metrics_add_default: terafoundation.prom_metrics_add_default,
            logger: debugLogger('prom-metrics-spec-logger'),
            assignment: 'master',
            labels: {},
            prefix: 'foundation_test_'
        };
        beforeAll(async () => {
            // This sets up the API endpoints in the context.
            api(context);
            context.logger = debugLogger('terafoundation-tests');
            await context.apis.foundation.promMetrics.init(config);
        });

        afterAll(async () => {
            await context.apis.foundation.promMetrics.shutdown();
        });

        it('should be able to add a gauge', async () => {
            await context.apis.foundation.promMetrics.addGauge('gauge1', 'help message', ['uuid'], function collect(this: Gauge) {
                const defaultLabels = context.apis.foundation.promMetrics.getDefaultLabels();
                this.inc({ uuid: 'h3L8JB6i', ...defaultLabels }, 1);
            });
            const result = context.apis.foundation.promMetrics.hasMetric('gauge1');
            expect(result).toBe(true);
        });

        it('should be able to increment a gauge', async () => {
            context.apis.foundation.promMetrics.inc('gauge1', { uuid: 'h3L8JB6i' }, 28);
            const response: Record<string, any> = await got(`http://127.0.0.1:${config.tf_prom_metrics_port}/metrics`, {
                throwHttpErrors: true
            });

            const value = response.body
                .split('\n')
                .filter((line: string) => line.includes('h3L8JB6i'))[0]
                .split(' ')[1];

            expect(value).toBe('29');
        });

        it('should be able to decrement a gauge', async () => {
            context.apis.foundation.promMetrics.dec('gauge1', { uuid: 'h3L8JB6i' }, 5);
            const response: Record<string, any> = await got(`http://127.0.0.1:${config.tf_prom_metrics_port}/metrics`, {
                throwHttpErrors: true
            });

            const value = response.body
                .split('\n')
                .filter((line: string) => line.includes('h3L8JB6i'))[0]
                .split(' ')[1];

            expect(value).toBe('25');
        });

        it('should be able to set a gauge', async () => {
            context.apis.foundation.promMetrics.set('gauge1', { uuid: 'h3L8JB6i' }, 103);
            const response: Record<string, any> = await got(`http://127.0.0.1:${config.tf_prom_metrics_port}/metrics`, {
                throwHttpErrors: true
            });

            const value = response.body
                .split('\n')
                .filter((line: string) => line.includes('h3L8JB6i'))[0]
                .split(' ')[1];

            expect(value).toBe('104');
        });

        it('should be able to delete a gauge', async () => {
            await context.apis.foundation.promMetrics.deleteMetric('gauge1');
            expect(context.apis.foundation.promMetrics.hasMetric('gauge1')).toBe(false);
        });
    });

    describe('histogram', () => {
        const context = {
            sysconfig: {
                terafoundation: {
                    log_level: 'debug',
                    prom_metrics_enabled: true,
                    prom_metrics_port: 3336,
                    prom_metrics_add_default: false
                },
                teraslice: {
                    cluster_manager_type: 'kubernetesV2',
                    name: 'tera-test'
                }
            },
        } as any;

        const { terafoundation, teraslice } = context.sysconfig;
        const config = {
            terasliceName: teraslice.name,
            tf_prom_metrics_enabled: terafoundation.prom_metrics_enabled,
            tf_prom_metrics_port: terafoundation.prom_metrics_port,
            tf_prom_metrics_add_default: terafoundation.prom_metrics_add_default,
            logger: debugLogger('prom-metrics-spec-logger'),
            assignment: 'master',
            prefix: 'foundation_test_'
        };

        beforeAll(async () => {
            // This sets up the API endpoints in the context.
            api(context);
            context.logger = debugLogger('terafoundation-tests');
            await context.apis.foundation.promMetrics.init(config);
        });

        afterAll(async () => {
            await context.apis.foundation.promMetrics.shutdown();
        });

        it('should be able to add a histogram', async () => {
            await context.apis.foundation.promMetrics.addHistogram(
                'histogram1',
                'help message',
                ['uuid'],
                function collect(this: Histogram) {
                    const defaultLabels = context.apis.foundation.promMetrics.getDefaultLabels();
                    this.observe({ uuid: '5Mw4Zfx2', ...defaultLabels }, 1000);
                },
                [0.1, 5, 15, 50, 100, 500, 1000]
            );
            const result = context.apis.foundation.promMetrics.hasMetric('histogram1');
            expect(result).toBe(true);
        });

        it('should be able to observe a histogram', async () => {
            context.apis.foundation.promMetrics.observe('histogram1', { uuid: '5Mw4Zfx2' }, 1);
            context.apis.foundation.promMetrics.observe('histogram1', { uuid: '5Mw4Zfx2' }, 1);
            context.apis.foundation.promMetrics.observe('histogram1', { uuid: '5Mw4Zfx2' }, 18);
            context.apis.foundation.promMetrics.observe('histogram1', { uuid: '5Mw4Zfx2' }, 120);
            context.apis.foundation.promMetrics.observe('histogram1', { uuid: '5Mw4Zfx2' }, 30);
            const response: Record<string, any> = await got(`http://127.0.0.1:${context.sysconfig.terafoundation.prom_metrics_port}/metrics`, {
                throwHttpErrors: true
            });

            const values = response.body
                .split('\n')
                .filter((line: string) => line.includes('5Mw4Zfx2'));

            expect(values
                .filter((line: string) => line.includes('histogram1_sum'))[0]
                .split(' ')[1]).toBe('1170');
            expect(values
                .filter((line: string) => line.includes('histogram1_count'))[0]
                .split(' ')[1]).toBe('6');
        });

        it('should be able to delete a histogram', async () => {
            await context.apis.foundation.promMetrics.deleteMetric('histogram1');
            expect(context.apis.foundation.promMetrics.hasMetric('histogram1')).toBe(false);
        });
    });

    describe('summary', () => {
        const context = {
            sysconfig: {
                terafoundation: {
                    log_level: 'debug',
                    prom_metrics_enabled: true,
                    prom_metrics_port: 3337,
                    prom_metrics_add_default: false
                },
                teraslice: {
                    cluster_manager_type: 'kubernetesV2',
                    name: 'tera-test'
                }
            },
        } as any;

        const { terafoundation, teraslice } = context.sysconfig;
        const config = {
            terasliceName: teraslice.name,
            tf_prom_metrics_enabled: terafoundation.prom_metrics_enabled,
            tf_prom_metrics_port: terafoundation.prom_metrics_port,
            tf_prom_metrics_add_default: terafoundation.prom_metrics_add_default,
            logger: debugLogger('prom-metrics-spec-logger'),
            assignment: 'master',
            prefix: 'foundation_test_'
        };
        beforeAll(async () => {
            // This sets up the API endpoints in the context.
            api(context);
            context.logger = debugLogger('terafoundation-tests');
            await context.apis.foundation.promMetrics.init(config);
        });

        afterAll(async () => {
            await context.apis.foundation.promMetrics.shutdown();
        });

        it('should be able to add a summary', async () => {
            await context.apis.foundation.promMetrics.addSummary(
                'summary1',
                'help message',
                ['uuid'],
                function collect(this: Summary) {
                    const defaultLabels = context.apis.foundation.promMetrics.getDefaultLabels();
                    this.observe({ uuid: 'nHy34Ol9', ...defaultLabels }, 1000);
                },
                60,
                5,
                [0.1, 0.5, 0.9]
            );
            const result = context.apis.foundation.promMetrics.hasMetric('summary1');
            expect(result).toBe(true);
        });

        it('should be able to observe a summary', async () => {
            context.apis.foundation.promMetrics.observe('summary1', { uuid: 'nHy34Ol9' }, 10);
            context.apis.foundation.promMetrics.observe('summary1', { uuid: 'nHy34Ol9' }, 20);
            context.apis.foundation.promMetrics.observe('summary1', { uuid: 'nHy34Ol9' }, 3);
            const response: Record<string, any> = await got(`http://127.0.0.1:${context.sysconfig.terafoundation.prom_metrics_port}/metrics`, {
                throwHttpErrors: true
            });

            const values = response.body
                .split('\n')
                .filter((line: string) => line.includes('nHy34Ol9'));

            expect(values
                .filter((line: string) => line.includes('summary1_sum'))[0]
                .split(' ')[1]).toBe('1033');
            expect(values
                .filter((line: string) => line.includes('summary1_count'))[0]
                .split(' ')[1]).toBe('4');
        });

        it('should be able to delete a summary', async () => {
            await context.apis.foundation.promMetrics.deleteMetric('summary1');
            expect(context.apis.foundation.promMetrics.hasMetric('summary1')).toBe(false);
        });
    });

    describe('getDefaultLabels', () => {
        const context = {
            sysconfig: {
                terafoundation: {
                    log_level: 'debug',
                    prom_metrics_enabled: true,
                    prom_metrics_port: 3337,
                    prom_metrics_add_default: false
                },
                teraslice: {
                    cluster_manager_type: 'kubernetesV2',
                    name: 'tera-test-labels'
                }
            },
        } as any;

        const { terafoundation, teraslice } = context.sysconfig;
        const config = {
            terasliceName: teraslice.name,
            tf_prom_metrics_enabled: terafoundation.prom_metrics_enabled,
            tf_prom_metrics_port: terafoundation.prom_metrics_port,
            tf_prom_metrics_add_default: terafoundation.prom_metrics_add_default,
            logger: debugLogger('prom-metrics-spec-logger'),
            assignment: 'master',
            prefix: 'foundation_test_',
            labels: { default1: 'value1' }
        };
        beforeAll(async () => {
            // This sets up the API endpoints in the context.
            api(context);
            context.logger = debugLogger('terafoundation-tests');
            await context.apis.foundation.promMetrics.init(config);
        });

        afterAll(async () => {
            await context.apis.foundation.promMetrics.shutdown();
        });
        it('should get all the default labels', () => {
            expect(context.apis.foundation.promMetrics.getDefaultLabels()).toEqual({
                name: 'tera-test-labels',
                default1: 'value1'
            });
        });
    });

    describe('resetMetrics', () => {
        const context = {
            sysconfig: {
                terafoundation: {
                    log_level: 'debug',
                    prom_metrics_enabled: true,
                    prom_metrics_port: 3337,
                    prom_metrics_add_default: false
                },
                teraslice: {
                    cluster_manager_type: 'kubernetesV2',
                    name: 'tera-test'
                }
            },
        } as any;

        const { terafoundation, teraslice } = context.sysconfig;
        const config = {
            terasliceName: teraslice.name,
            tf_prom_metrics_enabled: terafoundation.prom_metrics_enabled,
            tf_prom_metrics_port: terafoundation.prom_metrics_port,
            tf_prom_metrics_add_default: terafoundation.prom_metrics_add_default,
            logger: debugLogger('prom-metrics-spec-logger'),
            assignment: 'master',
            prefix: 'foundation_test_'
        };

        beforeAll(async () => {
            // This sets up the API endpoints in the context.
            api(context);
            context.logger = debugLogger('terafoundation-tests');
            await context.apis.foundation.promMetrics.init(config);
        });

        afterAll(async () => {
            await context.apis.foundation.promMetrics.shutdown();
        });

        it('should reset metrics', async () => {
            await context.apis.foundation.promMetrics.addGauge('gauge2', 'help message', ['uuid'], function collect(this: Gauge) {
                const defaultLabels = context.apis.foundation.promMetrics.getDefaultLabels();
                this.inc({ uuid: '7oBd9L3sJB', ...defaultLabels }, 0);
            });
            context.apis.foundation.promMetrics.inc('gauge2', { uuid: '7oBd9L3sJB' }, 200);
            const response1: Record<string, any> = await got(`http://127.0.0.1:${config.tf_prom_metrics_port}/metrics`, {
                throwHttpErrors: true
            });

            const value1 = response1.body
                .split('\n')
                .filter((line: string) => line.includes('7oBd9L3sJB'))[0]
                .split(' ')[1];

            expect(value1).toBe('200');

            context.apis.foundation.promMetrics.resetMetrics();

            const response2: Record<string, any> = await got(`http://127.0.0.1:${config.tf_prom_metrics_port}/metrics`, {
                throwHttpErrors: true
            });

            const value2 = response2.body
                .split('\n')
                .filter((line: string) => line.includes('7oBd9L3sJB'))[0]
                .split(' ')[1];

            expect(value2).toBe('0');
        });
    });
});
