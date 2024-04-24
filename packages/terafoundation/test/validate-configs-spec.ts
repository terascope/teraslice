import 'jest-extended';
import os from 'node:os';
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
            terafoundation: {},
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
            const validatedConfig = await validateConfigs(
                cluster, config as any, configFile as any
            );
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
                    'elasticsearch-next': {
                        default: {}
                    },
                    hdfs_ha: {
                        default: {}
                    },
                    hdfs: {
                        default: {}
                    },
                    s3: {
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
                                node: ['http://127.0.0.1:9200'],
                                sniffOnStart: false,
                                sniffOnConnectionFault: false,
                                requestTimeout: 120000,
                                maxRetries: 3,
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

        it('should throw', async () => {
            await expect(() => validateConfigs(
                { foo: 'bar' } as any,
                { foo: 'bar' } as any,
                configFile as any
            )).rejects.toThrow('Could not find connector: missing_connector to extract its schema');
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

        it('should throw an error', async () => {
            await expect(() => validateConfigs(cluster as any, config as any, configFile as any)).rejects.toThrow('Error validating configuration');
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

        it('should throw an error', async () => {
            await expect(() => validateConfigs(cluster as any, config as any, configFile as any)).rejects.toThrow('Error validating configuration');
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

        it('should throw an error', async () => {
            await expect(() => validateConfigs(cluster as any, config as any, configFile as any)).rejects.toThrow('Error validating configuration');
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

        it('should throw an error', async () => {
            await expect(() => validateConfigs(cluster as any, config as any, configFile as any)).rejects.toThrow('Error validating configuration');
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

        it('should throw an error', async () => {
            await expect(() => validateConfigs(cluster as any, config as any, configFile as any))
                .rejects.toThrow('Error validating configuration, caused by Error: asset_storage_connection: minio2 not found in terafoundation.connectors.s3: value was "minio2"');
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

        it('should throw an error', async () => {
            await expect(() => validateConfigs(cluster as any, config as any, configFile as any)).rejects.toThrow('Error validating configuration');
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

        it('should throw an error', async () => {
            await expect(() => validateConfigs(cluster as any, config as any, configFile as any))
                .rejects.toThrow('asset_storage_connection_type not found in terafoundation.connectors');
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

        it('should throw an error', async () => {
            await expect(() => validateConfigs(cluster as any, config as any, configFile as any))
                .rejects.toThrow('Error validating configuration, caused by Error: asset_storage_connection_type: Invalid asset_storage_connection_type. Valid types: elasticsearch-next,s3: value was "kafka"');
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

        it('should return valid config', async () => {
            const validatedConfig = await validateConfigs(
                cluster as any, config as any, configFile as any
            );

            expect(validatedConfig).toMatchObject({
                terafoundation: {
                    environment: 'test',
                    logging: ['console'],
                    log_level: 'info',
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
