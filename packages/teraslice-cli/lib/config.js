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
 */
class Config {
    constructor(cliArgs) {
        this.args = _.clone(_.mapKeys(cliArgs, (value, key) => _.camelCase(key)));
        this.configDir = this.args.configDir;
        this._setupConfigDir();
        this.aliases = new Aliases(this.aliasesFile);
    }

    // TODO: I suspect we'll be adding a method that returns the teraslice-client
    // for a specified alias

    // TODO: maybe other subcmds will be gotten this way instead of being bolted
    // on to the Config object like aliases, or maybe they won't even appear
    // here
    // getConfig(subCmd) {
    //     return require('./subCmd')
    // }

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
