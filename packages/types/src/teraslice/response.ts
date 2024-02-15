import { RecoveryCleanupType, ExecutionStatus } from './base.js';

export interface RecoverQuery {
    /** @deprecated use `cleanup_type` */
    cleanup?: RecoveryCleanupType;
    cleanup_type?: RecoveryCleanupType;
}

export interface PausedResponse {
    status: ExecutionStatus.paused;
}

export interface ResumeResponse {
    status: ExecutionStatus.running;
}

export interface StoppedResponse {
    status: ExecutionStatus.stopped | ExecutionStatus.stopping;
}

export interface StopQuery {
    timeout?: number;
    blocking?: boolean;
}

export interface ChangeWorkerResponse {
    message: string;
}

export interface ExecutionIDResponse {
    ex_id: string;
}
