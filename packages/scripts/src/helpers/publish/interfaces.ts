export enum PublishType {
    Docker = 'docker',
    NPM = 'npm',
    Docs = 'docs',
}

export type PublishOptions = {
    type: PublishType;
    tag?: string;
    dryRun: boolean;
};
