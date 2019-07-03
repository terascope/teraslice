export type PackageInfo = {
    dir: string;
    folderName: string;
    name: string;
    version: string;
    isTypescript: boolean;
    config: PackageConfig;
};

export type PackageConfig = {
    enableTypedoc?: boolean;
};

export const AvailablePackageConfigKeys: ReadonlyArray<keyof PackageConfig> = ['enableTypedoc'];

export type TSCommands = 'docs';
