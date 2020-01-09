import yargs from 'yargs';

export type CMD = yargs.CommandModule;

export interface GithubAssetConfig {
    arch: string;
    assetString: string;
    nodeVersion: string;
    platform: string;
}
