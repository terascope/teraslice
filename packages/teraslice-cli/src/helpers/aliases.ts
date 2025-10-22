import fs from 'node:fs';
import { AnyObject, has } from '@terascope/core-utils';
import yaml from 'js-yaml';
import Display from './display.js';

const display = new Display();

const defaultConfigData = {
    clusters: {
        localhost: { host: 'http://localhost:5678' }
    }
};

export default class Aliases {
    static writeSync(filename: string, obj: AnyObject): void {
        fs.writeFileSync(filename, yaml.dump(obj), { encoding: 'utf-8' });
    }

    static readSync(filename: string): AnyObject {
        const content = fs.readFileSync(filename, { encoding: 'utf-8' });
        return yaml.load(content) as AnyObject;
    }

    config: Record<string, Record<string, any>>;
    aliasesFile: string;

    constructor(aliasesFile: string) {
        this.aliasesFile = aliasesFile;
        this.config = this._getConfig();
    }

    private _getConfig() {
        let config;

        if (!fs.existsSync(this.aliasesFile)) {
            Aliases.writeSync(this.aliasesFile, defaultConfigData);
        }

        try {
            config = Aliases.readSync(this.aliasesFile);
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
            Aliases.writeSync(this.aliasesFile, this.config);
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
            Aliases.writeSync(this.aliasesFile, this.config);
        } else {
            throw new Error(`${clusterAlias} not in aliases list`);
        }
    }

    update(clusterAlias: string, newClusterUrl: string): void {
        if (has(this.config.clusters, clusterAlias)) {
            this.config.clusters[clusterAlias] = {
                host: newClusterUrl,
            };
            Aliases.writeSync(this.aliasesFile, this.config);
        } else {
            throw new Error(`${clusterAlias} not in aliases list`);
        }
    }
}
