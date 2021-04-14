import { dedupConfig } from './dedup';

export const recordTransformRepository = {
    dedup: dedupConfig
} as const;
