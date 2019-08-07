export enum PublishAction {
    Docker = 'docker',
    NPM = 'npm',
}

export type PublishOptions = {
    releaseType?: string;
    dryRun: boolean;
};
