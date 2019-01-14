'use strict';

const fs = require('fs');

const _ = require('lodash');

const Aliases = require('./aliases');

/**
 * This is the top level config object, it manages the config directory and
 * sub command configurations can be added on to this as properties.  Config
 * objects should only be used to make derived properties but should avoid
 * copying command line arguments or options, those should be accessed via the
 * .args object (which should not be modified)
 *
 * NOTE: All properties on this.args are mapped to camelCase
 */
class Config {
    constructor(cliArgs) {
        // We do this so that the command line options can be like 'cluster-url'
        // but the js properties are camelCase
        this.args = _.mapKeys(cliArgs, (value, key) => _.camelCase(key));
        this.configDir = this.args.configDir;
        this._setupConfigDir();
        this.aliases = new Aliases(this.aliasesFile);

        // If clusterAlias is a valid argument, then it must be present in the
        // config file.
        // TODO: This should probably be expressed with yargs somehow.
        if (_.has(this.args, 'clusterAlias')) {
            if (!this.aliases.present(this.args.clusterAlias)) {
                throw new Error(
                    `Alias, ${this.args.clusterAlias}, not found in config file: ${this.aliasesFile}`
                );
            }
        }
    }

    /**
     * Returns the URL of the appropriate cluster with the following order of
     * precedence:
     *
     *   * this.args.clusterUrl
     *   * URL found in config file using clusterAlias
     *
     * This implies that any command requiring clusterUrl or terasliceClient
     * should provide both the cluster-alias argument and the cluster-url option
     * Also, any command needing clusterUrl should use this instead of the cli
     * equivalents.
     */
    get clusterUrl() {
        if (this.args.clusterUrl) {
            return this.args.clusterUrl;
        }
        try {
            return this.aliases.config.clusters[this.args.clusterAlias].host;
        } catch (err) {
            throw new Error(`Unable to retrieve clusterAlias: ${this.args.clusterAlias} config:\n\n${err.stack}`);
        }
    }

    get aliasesFile() {
        return `${this.configDir}/aliases.yaml`;
    }

    get jobStateDir() {
        return `${this.configDir}/job_state_files`;
    }

    get assetDir() {
        return `${this.configDir}/assets`;
    }

    get allSubDirs() {
        return [
            this.jobStateDir,
            this.assetDir
        ];
    }

    _setupConfigDir() {
        if (!fs.existsSync(this.configDir)) {
            fs.mkdirSync(this.configDir);
        }

        this.allSubDirs.forEach((dir) => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }
        });
    }
}

module.exports = Config;
