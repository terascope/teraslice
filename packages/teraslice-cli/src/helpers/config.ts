import fs from 'node:fs';
import { has } from '@terascope/core-utils';
import Aliases from './aliases.js';
import { camelCase } from './utils.js';
import reply from './reply.js';

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
        this._addJobAction();
        this.configDir = this.args.configDir;
        this._setupConfigDir();
        this.aliases = new Aliases(this.aliasesFile);

        // If clusterAlias is a valid argument, then it must be present in the
        // config file.
        // TODO: This should probably be expressed with yargs somehow.
        if (has(this.args, 'clusterAlias')) {
            if (!this.aliases.present(this.args.clusterAlias)) {
                reply.fatal(`Alias, ${this.args.clusterAlias}, not found in config file: ${this.aliasesFile}`);
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
            return reply.fatal(`Unable to retrieve clusterAlias: ${this.args.clusterAlias} config:\n\n${err.stack}`);
        }
    }

    get aliasesFile(): string {
        return `${this.configDir}/aliases.yaml`;
    }

    /**
     * Returns the user provided output directory or
     * the current directory as default
     */
    get outdir(): string {
        if (this.args.outdir) {
            return this.args.outdir;
        } else {
            return process.cwd();
        }
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
            this.assetDir,
            this.outdir,
        ];
    }

    private _setupConfigDir() {
        if (!fs.existsSync(this.configDir)) {
            fs.mkdirSync(this.configDir);
        }

        this.allSubDirs.forEach((dir) => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    private _addJobAction() {
        if (this.args['']?.includes('jobs') || this.args['']?.includes('tjm')) {
            const [, action] = this.args[''];

            if (action != null) this.args._action = action;
        }
    }
}
