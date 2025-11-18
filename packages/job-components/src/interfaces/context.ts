import type { Teraslice, Terafoundation } from '@terascope/types';
import { ExecutionContextAPI } from '../execution-context';

export interface GetClientConfig {
    connection?: string;
    endpoint?: string;
    connection_cache?: boolean;
}

/*
* This will request a connection based on the 'connection' attribute of
* an opConfig. Intended as a context API endpoint.
*/
export interface OpRunnerAPI {
    getClient(config: GetClientConfig, type: string): Promise<any>;
}

export interface JobRunnerAPI {
    /** Get the first opConfig from an operation name */
    getOpConfig(name: string): Teraslice.OpConfig | undefined;
}

export interface AssetsAPI {
    /* Get the asset path from a asset name or ID */
    getPath(name: string): Promise<string>;
}

/**
 * Context includes the type definitions for
 * the APIs available to Worker or Slicer.
 * This extends the Terafoundation Context.
*/
export interface ExecutionContextAPIs {
    /**
     * Includes an API for getting a client from Terafoundation
    */
    assets: AssetsAPI;
    /**
     * Includes an API for getting a client from Terafoundation
    */
    op_runner: OpRunnerAPI;
    /**
     * Includes an API for getting a opConfig from the job
    */
    job_runner: JobRunnerAPI;
    /**
     * An API for registering and loading the new Job APIs
    */
    executionContext: ExecutionContextAPI;
}

export interface Context extends Terafoundation.Context<Teraslice.SysConfig, ExecutionContextAPIs> {
    assignment: Teraslice.Assignment;
}

export interface TestClientConfig {
    type: string;
    createClient?: Terafoundation.CreateClientFactoryFn;
    config?: Record<string, any>;
    endpoint?: string;
}

export interface TestContextApis extends ExecutionContextAPIs {
    setTestClients(clients: TestClientConfig[]): void;
    getTestClients(): TestClients;
}

export interface TestClients {
    [type: string]: TestClientsByEndpoint;
}

export interface TestClientsByEndpoint {
    [endpoint: string]: any;
}

export interface TestContextType extends Terafoundation.Context<
    Teraslice.SysConfig, TestContextApis> {
}
