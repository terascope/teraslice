export type PackageInfo = {
    dir: string;
    folderName: string;
    name: string;
    displayName: string;
    version: string;
    description: string;
    isTypescript: boolean;
    license: string;
    config: PackageConfig;
    pkgJSON: any;
};

export type PackageConfig = {
    enableTypedoc?: boolean;
};

export const AvailablePackageConfigKeys: ReadonlyArray<keyof PackageConfig> = ['enableTypedoc'];

export type TSCommands = 'docs';
