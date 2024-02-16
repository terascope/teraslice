import {
    RecoveryCleanupType,
} from './base.js';

export interface StopQuery {
    timeout?: number;
    blocking?: boolean;
}


export interface RecoverQuery {
    /** @deprecated use `cleanup_type` */
    cleanup?: RecoveryCleanupType;
    cleanup_type?: RecoveryCleanupType;
}
