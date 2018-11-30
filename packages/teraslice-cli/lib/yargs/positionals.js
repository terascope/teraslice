'use strict';


class Positionals {
    constructor() {
        this.positionals = {
            cluster_alias: () => ({
                describe: 'cluster alias',
                type: 'string'
            }),
            new_cluster_alias: () => ({
                describe: 'new cluster alias to add to config file',
                type: 'string'
            }),
            new_cluster_url: () => ({
                describe: 'new cluster url to add to the config file',
                type: 'string'
            }),
        };
    }

    build(key, ...args) {
        return this.positionals[key](...args);
    }
}

module.exports = Positionals;
