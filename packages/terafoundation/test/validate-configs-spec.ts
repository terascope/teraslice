import 'jest-extended';
import os from 'os';
import { Cluster } from '../src';
import validateConfigs from '../src/validate-configs';

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

        it('should return a valid config', () => {
            const validatedConfig = validateConfigs(cluster, config as any, configFile as any);
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

    describe('when using connectors that exist', () => {
        const configFile = {
            terafoundation: {
                log_level: [
                    { console: 'warn' }
                ],
                connectors: {
                    elasticsearch: {
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

        it('should return a valid config', () => {
            const validatedConfig = validateConfigs(
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
                        elasticsearch: {
                            default: {
                                apiVersion: '6.5',
                                deadTimeout: 30000,
                                host: [
                                    '127.0.0.1:9200'
                                ],
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
                                bucketEndpoint: false,
                                forcePathStyle: false,
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
                    elasticsearch: {
                        default: {}
                    },
                    missing_connector: {},
                }
            }
        };

        it('should return a valid config', () => {
            const validatedConfig = validateConfigs(
                { foo: 'bar' } as any,
                { foo: 'bar' } as any,
                configFile as any
            );
            expect(validatedConfig).toMatchObject({
                terafoundation: {
                    connectors: {
                        elasticsearch: {},
                        missing_connector: {}
                    },
                },
                _nodeName: os.hostname()
            });
        });
    });

    describe('when given an invalid logging config', () => {
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

        it('should throw an error', () => {
            expect(() => validateConfigs(cluster as any, config as any, configFile as any)).toThrow('Error validating configuration');
        });
    });

    describe('when given an invalid log_level', () => {
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

        it('should throw an error', () => {
            expect(() => validateConfigs(cluster as any, config as any, configFile as any)).toThrow('Error validating configuration');
        });
    });

    describe('when given an invalid asset_storage_bucket', () => {
        const configFile = {
            terafoundation: {
                asset_storage_bucket: 123,
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

        it('should throw an error', () => {
            expect(() => validateConfigs(cluster as any, config as any, configFile as any)).toThrow('Error validating configuration');
        });
    });

    describe('when given an invalid asset_storage_connection', () => {
        const configFile = {
            terafoundation: {
                asset_storage_connection: 123,
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

        it('should throw an error', () => {
            expect(() => validateConfigs(cluster as any, config as any, configFile as any)).toThrow('Error validating configuration');
        });
    });

    describe('when given an asset_storage_connection that does not exist on that connection type', () => {
        const configFile = {
            terafoundation: {
                asset_storage_connection_type: 's3',
                asset_storage_connection: 'minio2',
                connectors: {
                    'elasticsearch-next': {
                        default: {}
                    },
                    s3: {
                        minio1: {},
                    }
                }
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

        it('should throw an error', () => {
            expect(() => validateConfigs(cluster as any, config as any, configFile as any))
                .toThrow('Error validating configuration, caused by Error: asset_storage_connection: minio2 not found in terafoundation.connectors.s3: value was "minio2"');
        });
    });

    describe('when given an invalid asset_storage_connection_type', () => {
        const configFile = {
            terafoundation: {
                asset_storage_connection_type: 123,
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

        it('should throw an error', () => {
            expect(() => validateConfigs(cluster as any, config as any, configFile as any)).toThrow('Error validating configuration');
        });
    });

    describe('when given an asset_storage_connection_type that does not exist', () => {
        const configFile = {
            terafoundation: {
                asset_storage_connection_type: 's3',
                connectors: {
                    'elasticsearch-next': {
                        default: {}
                    }
                }
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

        it('should throw an error', () => {
            expect(() => validateConfigs(cluster as any, config as any, configFile as any))
                .toThrow('asset_storage_connection_type not found in terafoundation.connectors');
        });
    });
    describe('when given an asset_storage_connection_type that is invalid', () => {
        const configFile = {
            terafoundation: {
                asset_storage_connection_type: 'kafka',
                connectors: {
                    'elasticsearch-next': {
                        default: {}
                    },
                    kafka: {
                        default: {}
                    }
                }
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

        it('should throw an error', () => {
            expect(() => validateConfigs(cluster as any, config as any, configFile as any))
                .toThrow('Error validating configuration, caused by Error: asset_storage_connection_type: Invalid asset_storage_connection_type. Valid types: elasticsearch-next,elasticsearch,s3: value was "kafka"');
        });
    });

    describe('when given a config with an elasticsearch with no default connection', () => {
        const configFile = {
            terafoundation: {
                connectors: {
                    'elasticsearch-next': {
                        'not-default': {}
                    }
                }
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

        const validatedConfig = validateConfigs(cluster as any, config as any, configFile as any);
        it('should return valid config', () => {
            expect(validatedConfig).toMatchObject({
                terafoundation: {
                    environment: 'test',
                    logging: ['console'],
                    log_level: 'info',
                    workers: 10,
                    asset_storage_bucket: undefined,
                    connectors: {
                        'elasticsearch-next': {
                            'not-default': {
                                node: ['http://127.0.0.1:9200'],
                                sniffOnStart: false,
                                sniffOnConnectionFault: false,
                                requestTimeout: 120000,
                                maxRetries: 3
                            }
                        }
                    },
                },
                other: {},
                _nodeName: os.hostname()
            });
        });
    });
});
