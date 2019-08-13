'use strict';

const os = require('os');

jest.mock('elasticsearch');
jest.mock('node-webhdfs');
jest.mock('mongoose');
jest.mock('redis');
jest.mock('aws-sdk');
jest.mock('node-statsd');

const validateConfigs = require('../lib/validate_configs');

describe('Validate Configs', () => {
    describe('when using mainly defaults', () => {
        const cluster = {
            isMaster: false,
            worker: {
                id: 'someid'
            }
        };

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
                    coerce(val) {
                        return val;
                    },
                },
            ]
        };

        it('should return a valid config', () => {
            const validatedConfig = validateConfigs(cluster, config, configFile);
            expect(validatedConfig).toMatchObject({
                terafoundation: {
                    connectors: {},
                    environment: 'test',
                    workers: 4,
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
            const validatedConfig = validateConfigs({}, {}, configFile);
            expect(validatedConfig).toMatchObject({
                terafoundation: {
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
                    workers: 4,
                },
                _nodeName: os.hostname()
            });
        });
    });

    describe('when given invalid config', () => {
        const configFile = {
            terafoundation: {
                log_level: 'uhoh'
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
            expect(() => validateConfigs(cluster, config, configFile)).toThrowError('Error validating configuration');
        });
    });
});
