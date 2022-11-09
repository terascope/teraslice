import 'jest-extended';
import os from 'os';
import { Cluster } from '../src/index.js';
import validateConfigs from '../src/validate-configs.js';

describe('Validate Configs', () => {
    describe('when using mainly defaults', () => {
        const cluster: Cluster = {
            isWorker: true,
            isMaster: false,
            worker: {
                id: 'someid'
            }
        } as any;

        const configFile = {
            terafoundation: {

            },
            other: {
                test: 'custom'
            }
        };

        const config = {
            config_schema: {
                test: {
                    doc: 'test',
                    format: 'test_Format',
                    default: 'test'
                }
            },
            schema_formats: [
                {
                    name: 'test_Format',
                    validate() {},
                    coerce(val: any) {
                        return val;
                    },
                },
            ]
        };

        it('should return a valid config', async () => {
            const validatedConfig = await validateConfigs(cluster, config as any, configFile as any);
            expect(validatedConfig).toMatchObject({
                terafoundation: {
                    connectors: {},
                    environment: 'test',
                },
                other: {
                    test: 'custom'
                },
                _nodeName: `${os.hostname()}.someid`
            });
        });
    });

    describe('when using using connectors that exist', () => {
        const configFile = {
            terafoundation: {
                log_level: [
                    { console: 'warn' }
                ],
                connectors: {
                    'elasticsearch-next': {
                        default: {}
                    },
                    hdfs_ha: {
                        default: {}
                    },
                    hdfs: {
                        default: {}
                    },
                    mongodb: {
                        default: {}
                    },
                    redis: {
                        default: {}
                    },
                    s3: {
                        default: {}
                    },
                    statsd: {
                        default: {}
                    },
                }
            }
        };

        it('should return a valid config', async () => {
            const validatedConfig = await validateConfigs(
                { foo: 'bar' } as any,
                { foo: 'bar' } as any,
                configFile as any
            );

            expect(validatedConfig).toMatchObject({
                terafoundation: {
                    log_level: [
                        { console: 'warn' }
                    ],
                    connectors: {
                        'elasticsearch-next': {
                            default: {
                                maxRetries: 3,
                                requestTimeout: 120000,
                                sniffOnConnectionFault: false,
                                sniffOnStart: false,
                            }
                        },
                        hdfs_ha: {
                            default: {
                                namenode_host: null,
                                namenode_port: 50070,
                                path_prefix: '/webhdfs/v1',
                                user: 'hdfs'
                            }
                        },
                        hdfs: {
                            default: {
                                namenode_host: 'localhost',
                                namenode_port: 50070,
                                path_prefix: '/webhdfs/v1',
                                user: 'webuser'
                            }
                        },
                        mongodb: {
                            default: {
                                servers: 'mongodb://localhost:27017/test'
                            }
                        },
                        redis: {
                            default: {
                                host: '127.0.0.1',
                                port: 6379
                            }
                        },
                        s3: {
                            default: {
                                accessKeyId: null,
                                certLocation: '',
                                endpoint: '127.0.0.1:80',
                                maxRedirects: 10,
                                maxRetries: 3,
                                region: 'us-east-1',
                                s3BucketEndpoint: false,
                                s3ForcePathStyle: false,
                                secretAccessKey: null,
                                sslEnabled: true,
                            }
                        },
                        statsd: {
                            default: {
                                host: '127.0.0.1',
                                mock: false
                            }
                        },
                    },
                    environment: 'test',
                },
                _nodeName: os.hostname()
            });
        });
    });

    describe("when using using a connector that doesn't exist", () => {
        const configFile = {
            terafoundation: {
                connectors: {
                    'elasticsearch-next': {
                        default: {}
                    },
                    missing_connector: {},
                }
            }
        };

        it('should return a valid config', async () => {
            const validatedConfig = await validateConfigs(
                { foo: 'bar' } as any,
                { foo: 'bar' } as any,
                configFile as any
            );
            expect(validatedConfig).toMatchObject({
                terafoundation: {
                    connectors: {
                        'elasticsearch-next': {},
                        missing_connector: {}
                    },
                },
                _nodeName: os.hostname()
            });
        });
    });

    describe('when given an logging config', () => {
        const configFile = {
            terafoundation: {
                log_level: 'uhoh',
            },
            other: {}
        };
        const cluster = {
            isMaster: true,
        };
        const config = {
            config_schema() {
                return {};
            }
        };

        it('should throw an error', async () => {
            await expect(() => validateConfigs(cluster as any, config as any, configFile as any)).rejects.toThrowError('Error validating configuration');
        });
    });

    describe('when given an invalid log_level', () => {
        const configFile = {
            terafoundation: {
                logging: 'hello'
            },
            other: {}
        };
        const cluster = {
            isMaster: true,
        };
        const config = {
            config_schema() {
                return {};
            }
        };

        it('should throw an error', async () => {
            await expect(() => validateConfigs(cluster as any, config as any, configFile as any)).rejects.toThrowError('Error validating configuration');
        });
    });
});
