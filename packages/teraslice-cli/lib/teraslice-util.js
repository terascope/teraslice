'use strict';

const _ = require('lodash');

class TerasliceUtil {
    constructor(cliConfig) {
        this.config = cliConfig;
    }

    get client() {
        return require('teraslice-client-js')({ host: this.config.clusterUrl });
    }

    async info() {
        return this.client.cluster.info();
    }

    async type() {
        let clusterInfo = {};
        let clusteringType = 'native';
        try {
            clusterInfo = await this.info();
            if (_.has(clusterInfo, 'clustering_type')) {
                clusteringType = clusterInfo.clustering_type;
            } else {
                clusteringType = 'native';
            }
        } catch (err) {
            if (err.code === 405 && err.error === 405) {
                clusteringType = 'native';
            }
        }
        return clusteringType;
    }

    parseResponse(response, header) {
        const rows = [];
        _.each(response, (value, key) => {
            const row = [];
            _.each(header, (item) => {
                if (item === 'active') {
                    row.push(response[key][item].length);
                } else {
                    row.push(response[key][item]);
                }
            });
            rows.push(row);
        });
        return rows;
    }

    parseStateResponse(response, header, id) {
        const rows = [];
        _.each(response, (value, key) => {
            _.each(response[key].active, (activeValue) => {
                const row = [];
                // filter by id
                if (id === undefined || activeValue.job_id === id || activeValue.ex_id === id) {
                    _.each(header, (item) => {
                        if (item === 'teraslice_version') {
                            row.push(response[key].teraslice_version);
                        } else if (item === 'node_id') {
                            row.push(response[key].node_id);
                        } else if (item === 'hostname') {
                            row.push(response[key].hostname);
                        } else if (item === 'node_version') {
                            row.push(response[key].node_version);
                        } else {
                            row.push(activeValue[item]);
                        }
                    });
                    rows.push(row);
                }
            });
        });

        return rows;
    }
}

module.exports = TerasliceUtil;
