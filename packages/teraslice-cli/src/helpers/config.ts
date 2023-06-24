import fs from 'fs';
import { has } from '@terascope/utils';
import Aliases from './aliases';
import { camelCase } from '../helpers/utils';
import reply from './reply';

/**
 * This is the top level config object, it manages the config directory and
 * sub command configurations can be added on to this as properties.  Config
 * objects should only be used to make derived properties but should avoid
 * copying command line arguments or options, those should be accessed via the
 * .args object (which should not be modified)
 *
 * NOTE: All properties on this.args are mapped to camelCase
 */
export default class Config {
    private configDir: string;
    args: Record<string, any>;
    aliases: Aliases;

    constructor(cliArgs: Record<string, any>) {
        // We do this so that the command line options can be like 'cluster-url'
        // but the js properties are camelCase
        this.args = {};
        Object.entries(cliArgs).forEach(([key, value]) => {
            this.args[camelCase(key)] = value;
        });
        this.addJobAction();
        this.configDir = this.args.configDir;
        this._setupConfigDir();
        this.aliases = new Aliases(this.aliasesFile);

        // If clusterAlias is a valid argument, then it must be present in the
        // config file.
        // TODO: This should probably be expressed with yargs somehow.
        if (has(this.args, 'clusterAlias')) {
            if (!this.aliases.present(this.args.clusterAlias)) {
                throw new Error(
                    `Alias, ${this.args.clusterAlias}, not found in config file: ${this.aliasesFile}`
                );
            }
        }
        if (this.args.quiet) {
            reply.quiet = true;
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
    get clusterUrl(): string {
        if (this.args.clusterUrl) {
            return this.args.clusterUrl;
        }
        try {
            return this.aliases.config.clusters[this.args.clusterAlias].host;
        } catch (err) {
            throw new Error(`Unable to retrieve clusterAlias: ${this.args.clusterAlias} config:\n\n${err.stack}`);
        }
    }

    get aliasesFile(): string {
        return `${this.configDir}/aliases.yaml`;
    }

    get jobStateDir(): string {
        return `${this.configDir}/job_state_files`;
    }

    get jobStateFile(): string {
        return `${this.jobStateDir}/${this.args.clusterAlias}.json`;
    }

    get assetDir(): string {
        return `${this.configDir}/assets`;
    }

    get allSubDirs(): string[] {
        return [
            this.jobStateDir,
            this.assetDir
        ];
    }

    private _setupConfigDir() {
        if (!fs.existsSync(this.configDir)) {
            fs.mkdirSync(this.configDir);
        }

        this.allSubDirs.forEach((dir) => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }
        });
    }

    private addJobAction() {
        if (this.args[''].includes('jobs')) {
            const [, action] = this.args[''];

            if (action != null) this.args._action = action;
        }
    }
}
