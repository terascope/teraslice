import * as yargs from 'yargs';

export type CMD = yargs.CommandModule;

export interface GithubAssetConfig {
    arch: string;
    assetString: string;
    bundle: boolean;
    nodeVersion: string;
    platform: string;
}
