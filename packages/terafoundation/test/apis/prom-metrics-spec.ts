/* eslint-disable import/first */
import 'jest-extended';
import { debugLogger } from '@terascope/utils';
import got from 'got';

import api from '../../src/api';

describe('promMetrics foundation API', () => {
    describe('init', () => {
        describe('in native clustering', () => {
            const context = {
                sysconfig: {
                    terafoundation: {
                        log_level: 'debug',
                        prom_metrics_enabled: true,
                        prom_metrics_port: 3333,
                        prom_metrics_add_default: true
                    },
                    teraslice: {
                        cluster_manager_type: 'native'
                    }
                }
            } as any;

            const config = {
                context,
                logger: debugLogger('prom-metrics-spec-logger'),
                assignment: 'cluster-master'
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

            it('should not throw an error when making a call to uninitialized promMetricsAPI', async () => {
                expect(async () => context.apis.foundation.promMetrics.addMetric('native_counter', 'help message', ['uuid'], 'counter')).not.toThrow();
                expect(async () => context.apis.foundation.promMetrics.inc('native_counter', { uuid: 'fsd784bf' }, 1)).not.toThrow();
                expect(context.apis.foundation.promMetrics.hasMetric('native_counter')).toBe(false);
            });
        });

        describe('in kubernetes clustering', () => {
            describe('with prom metrics enabled in terafoundation', () => {
                describe('with enable_prom_metrics undefined in jobConfig', () => {
                    const context = {
                        sysconfig: {
                            terafoundation: {
                                log_level: 'debug',
                                prom_metrics_enabled: true,
                                prom_metrics_port: 3333,
                                prom_metrics_add_default: true
                            },
                            teraslice: {
                                cluster_manager_type: 'kubernetes'
                            }
                        }
                    } as any;

                    const config = {
                        context,
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

                    it('should initialize a promMetricsAPI', async () => {
                        const result = await context.apis.foundation.promMetrics.init(config);
                        expect(result).toBe(true);
                    });

                    it('should be able to verifyApi', async () => {
                        const apiExists = await context.apis.foundation.promMetrics.verifyAPI();
                        expect(apiExists).toBe(true);
                    });

                    it('should throw an error if promMetricsAPI is already initialized', async () => {
                        expect(() => context.apis.foundation.promMetrics.init(config))
                            .toThrow('Prom metrics API cannot be initialized more than once.');
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
                                cluster_manager_type: 'kubernetes'
                            }
                        }
                    } as any;

                    const config = {
                        context,
                        logger: debugLogger('prom-metrics-spec-logger'),
                        assignment: 'worker',
                        metrics_enabled_by_job: false
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
                                cluster_manager_type: 'kubernetes'
                            }
                        }
                    } as any;

                    const config = {
                        context,
                        logger: debugLogger('prom-metrics-spec-logger'),
                        assignment: 'worker',
                        metrics_enabled_by_job: true
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
                        expect(() => context.apis.foundation.promMetrics.init(config))
                            .toThrow('Prom metrics API cannot be initialized more than once.');
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
                                cluster_manager_type: 'kubernetes'
                            }
                        }
                    } as any;

                    const config = {
                        context,
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
                                cluster_manager_type: 'kubernetes'
                            }
                        }
                    } as any;

                    const config = {
                        context,
                        logger: debugLogger('prom-metrics-spec-logger'),
                        assignment: 'worker',
                        metrics_enabled_by_job: false
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
                                cluster_manager_type: 'kubernetes'
                            }
                        }
                    } as any;

                    const config = {
                        context,
                        logger: debugLogger('prom-metrics-spec-logger'),
                        assignment: 'worker',
                        metrics_enabled_by_job: true
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
                        expect(() => context.apis.foundation.promMetrics.init(config))
                            .toThrow('Prom metrics API cannot be initialized more than once.');
                    });
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
                    cluster_manager_type: 'kubernetes'
                }
            }
        } as any;

        const config = {
            context,
            logger: debugLogger('prom-metrics-spec-logger'),
            assignment: 'cluster-master',
            port: 3333,
            default_metrics: false,
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
            await context.apis.foundation.promMetrics.addMetric('counter1', 'help message', ['uuid'], 'counter');
            const result = context.apis.foundation.promMetrics.hasMetric('counter1');
            expect(result).toBe(true);
        });

        it('should be able to increment a counter', async () => {
            context.apis.foundation.promMetrics.inc('counter1', { uuid: '5g3kJr' }, 17);
            const response: Record<string, any> = await got(`http://127.0.0.1:${config.port}/metrics`, {
                throwHttpErrors: true
            });

            const value = response.body
                .split('\n')
                .filter((line: string) => line.includes('5g3kJr'))[0]
                .split(' ')[1];

            expect(value).toBe('17');
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
                    cluster_manager_type: 'kubernetes'
                }
            }
        } as any;

        const config = {
            context,
            logger: debugLogger('prom-metrics-spec-logger'),
            assignment: 'cluster-master',
            port: 3333,
            default_metrics: true,
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
            await context.apis.foundation.promMetrics.addMetric('gauge1', 'help message', ['uuid'], 'gauge');
            const result = context.apis.foundation.promMetrics.hasMetric('gauge1');
            expect(result).toBe(true);
        });

        it('should be able to increment a gauge', async () => {
            context.apis.foundation.promMetrics.inc('gauge1', { uuid: 'h3L8JB6i' }, 28);
            const response: Record<string, any> = await got(`http://127.0.0.1:${config.port}/metrics`, {
                throwHttpErrors: true
            });

            const value = response.body
                .split('\n')
                .filter((line: string) => line.includes('h3L8JB6i'))[0]
                .split(' ')[1];

            expect(value).toBe('28');
        });

        it('should be able to decrement a gauge', async () => {
            context.apis.foundation.promMetrics.dec('gauge1', { uuid: 'h3L8JB6i' }, 1);
            const response: Record<string, any> = await got(`http://127.0.0.1:${config.port}/metrics`, {
                throwHttpErrors: true
            });

            const value = response.body
                .split('\n')
                .filter((line: string) => line.includes('h3L8JB6i'))[0]
                .split(' ')[1];

            expect(value).toBe('27');
        });

        it('should be able to set a gauge', async () => {
            context.apis.foundation.promMetrics.set('gauge1', { uuid: 'h3L8JB6i' }, 103);
            const response: Record<string, any> = await got(`http://127.0.0.1:${config.port}/metrics`, {
                throwHttpErrors: true
            });

            const value = response.body
                .split('\n')
                .filter((line: string) => line.includes('h3L8JB6i'))[0]
                .split(' ')[1];

            expect(value).toBe('103');
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
                    cluster_manager_type: 'kubernetes'
                }
            }
        } as any;

        const config = {
            context,
            logger: debugLogger('prom-metrics-spec-logger'),
            assignment: 'cluster-master',
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
            await context.apis.foundation.promMetrics.addMetric(
                'histogram1',
                'help message',
                ['uuid'],
                'histogram',
                [0.1, 5, 15, 50, 100, 500]
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
                .split(' ')[1]).toBe('170');
            expect(values
                .filter((line: string) => line.includes('histogram1_count'))[0]
                .split(' ')[1]).toBe('5');
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
                    cluster_manager_type: 'kubernetes'
                }
            }
        } as any;

        const config = {
            context,
            logger: debugLogger('prom-metrics-spec-logger'),
            assignment: 'cluster-master',
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
                .split(' ')[1]).toBe('33');
            expect(values
                .filter((line: string) => line.includes('summary1_count'))[0]
                .split(' ')[1]).toBe('3');
        });

        it('should be able to delete a summary', async () => {
            await context.apis.foundation.promMetrics.deleteMetric('summary1');
            expect(context.apis.foundation.promMetrics.hasMetric('summary1')).toBe(false);
        });
    });
});
