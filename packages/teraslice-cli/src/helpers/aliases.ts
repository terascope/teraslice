import fs from 'node:fs';
import { has } from '@terascope/core-utils';
import { dump, load } from 'js-yaml';
import Display from './display.js';

const display = new Display();

export type ApiVersion = 'v1' | 'v2';
export const API_VERSIONS: readonly ApiVersion[] = ['v1', 'v2'];

const defaultConfigData = {
    clusters: {
        localhost: { host: 'http://localhost:5678' }
    }
};

export default class Aliases {
    static writeSync(filename: string, obj: Record<string, any>): void {
        fs.writeFileSync(filename, dump(obj), { encoding: 'utf-8' });
    }

    static readSync(filename: string): Record<string, any> {
        const content = fs.readFileSync(filename, { encoding: 'utf-8' });
        return load(content) as Record<string, any>;
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
    add(newClusterAlias: string, newClusterUrl: string, apiVersion: ApiVersion = 'v1'): void {
        if (has(this.config.clusters, newClusterAlias)) {
            throw new Error(`${newClusterAlias} already exists`);
        } else {
            this.config.clusters[newClusterAlias] = {
                host: newClusterUrl,
                apiVersion,
            };
            Aliases.writeSync(this.aliasesFile, this.config);
        }
    }

    list(output = 'txt'): void {
        const header = ['cluster', 'host', 'apiVersion'];
        const clusters: any[] = [];
        Object.entries(this.config.clusters)
            .forEach(([cluster, val]: [string, any]) => {
                clusters.push({ cluster, host: val.host, apiVersion: val.apiVersion ?? 'v1' });
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

    /**
     * An alias without an apiVersion predates /v2 support and uses /v1
     */
    getApiVersion(clusterAlias: string): ApiVersion {
        const { apiVersion = 'v1' } = this.config.clusters[clusterAlias] ?? {};
        if (!API_VERSIONS.includes(apiVersion)) {
            throw new Error(`${clusterAlias} has an invalid apiVersion "${apiVersion}" in ${this.aliasesFile}, must be one of ${API_VERSIONS.join(', ')}`);
        }
        return apiVersion;
    }

    setApiVersion(clusterAlias: string, apiVersion: ApiVersion): void {
        if (!has(this.config.clusters, clusterAlias)) {
            throw new Error(`${clusterAlias} not in aliases list`);
        }
        this.config.clusters[clusterAlias].apiVersion = apiVersion;
        Aliases.writeSync(this.aliasesFile, this.config);
    }

    update(clusterAlias: string, newClusterUrl: string): void {
        if (has(this.config.clusters, clusterAlias)) {
            this.config.clusters[clusterAlias] = {
                ...this.config.clusters[clusterAlias],
                host: newClusterUrl,
            };
            Aliases.writeSync(this.aliasesFile, this.config);
        } else {
            throw new Error(`${clusterAlias} not in aliases list`);
        }
    }
}
