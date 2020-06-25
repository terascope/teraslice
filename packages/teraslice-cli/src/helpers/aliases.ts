import fs from 'fs';
import { has } from '@terascope/utils';
// @ts-expect-error
import yaml from 'node-yaml';
import Display from '../cmds/lib/display';

const display = new Display();

const defaultConfigData = {
    clusters: {
        localhost: { host: 'http://localhost:5678' }
    }
};

export default class Aliases {
    config: any;
    aliasesFile: string;
    constructor(aliasesFile: string) {
        this.aliasesFile = aliasesFile;
        this.config = this._getConfig();
    }

    private _getConfig() {
        let config;

        if (!fs.existsSync(this.aliasesFile)) {
            yaml.writeSync(this.aliasesFile, defaultConfigData);
        }

        try {
            config = yaml.readSync(this.aliasesFile);
        } catch (err) {
            throw new Error(`Failed to load ${this.aliasesFile}: ${err}`);
        }
        return config;
    }

    // FIXME: we need to ensure newClusterUrl is valid
    //   1: a valid URL
    //   2: an actual cluster that responds
    add(newClusterAlias: string, newClusterUrl: string): void {
        if (has(this.config.clusters, newClusterAlias)) {
            throw new Error(`${newClusterAlias} already exists`);
        } else {
            this.config.clusters[newClusterAlias] = {
                host: newClusterUrl,
            };
            yaml.writeSync(this.aliasesFile, this.config);
        }
    }

    list(output = 'txt'): void {
        const header = ['cluster', 'host'];
        const clusters: any[] = [];
        Object.entries(this.config.clusters)
            .forEach(([cluster, val]: [string, any]) => {
                clusters.push({ cluster, host: val.host });
            });

        display.display(header, clusters, output);
    }

    present(alias: string): boolean {
        return has(this.config.clusters, alias);
    }

    remove(clusterAlias: string): void {
        if (has(this.config.clusters, clusterAlias)) {
            delete this.config.clusters[clusterAlias];
            yaml.writeSync(this.aliasesFile, this.config);
        } else {
            throw new Error(`${clusterAlias} not in aliases list`);
        }
    }

    update(clusterAlias: string, newClusterUrl: string) : void {
        if (has(this.config.clusters, clusterAlias)) {
            this.config.clusters[clusterAlias] = {
                host: newClusterUrl,
            };
            yaml.writeSync(this.aliasesFile, this.config);
        } else {
            throw new Error(`${clusterAlias} not in aliases list`);
        }
    }
}
