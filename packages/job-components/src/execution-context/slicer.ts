import { cloneDeep } from '@terascope/utils';
import {
    SlicerOperationLifeCycle,
    ExecutionStats,
    Slice,
    SliceResult,
    SlicerRecoveryData
} from '../interfaces';
import SlicerCore from '../operations/core/slicer-core';
import { ExecutionContextConfig, JobAPIInstances } from './interfaces';
import BaseExecutionContext from './base';

/**
 * SlicerExecutionContext is designed to add more
 * functionality to interface with the
 * Execution Configuration and any Operation.
 */
export class SlicerExecutionContext
    extends BaseExecutionContext<SlicerOperationLifeCycle>
    implements SlicerOperationLifeCycle {
    // ...
    private readonly _slicer: SlicerCore;
    private slicesComplete = 0;

    constructor(config: ExecutionContextConfig) {
        super(config, 'slicer_context');

        this._methodRegistry.set('onSliceComplete', new Set());
        this._methodRegistry.set('onSliceDispatch', new Set());
        this._methodRegistry.set('onSliceEnqueued', new Set());
        this._methodRegistry.set('onExecutionStats', new Set());

        // then register the apis specified in config.apis
        for (const apiConfig of this.config.apis || []) {
            const name = apiConfig._name;
            const apiMod = this._loader.loadAPI(name, this.assetIds);

            this.api.addToRegistry(name, apiMod.API);
        }

        const readerConfig = this.config.operations[0];
        const mod = this._loader.loadReader(readerConfig._op, this.assetIds);

        if (mod.API) {
            this.api.addToRegistry(readerConfig._op, mod.API);
        }

        const op = new mod.Slicer(this.context, cloneDeep(readerConfig), this.config);
        this._slicer = op;
        this.addOperation(op);

        this._resetMethodRegistry();

        (async () => {
            if (this.context.sysconfig.teraslice.cluster_manager_type === 'native') {
                this.logger.warn('Skipping PromMetricsAPI initialization: incompatible with native clustering.');
                return;
            }
            const { terafoundation } = this.context.sysconfig;
            await config.context.apis.foundation.promMetrics.init({
                assignment: 'execution_controller',
                logger: this.logger,
                tf_prom_metrics_add_default: terafoundation.prom_metrics_add_default,
                tf_prom_metrics_enabled: terafoundation.prom_metrics_enabled,
                tf_prom_metrics_port: terafoundation.prom_metrics_port,
                job_prom_metrics_add_default: config.executionConfig.prom_metrics_add_default,
                job_prom_metrics_enabled: config.executionConfig.prom_metrics_enabled,
                job_prom_metrics_port: config.executionConfig.prom_metrics_port,
                labels: {
                    ex_id: this.exId,
                    job_id: this.jobId,
                    job_name: this.config.name,
                }
            });
        })();
    }

    /**
     * Called during execution initialization
     * @param recoveryData is the data to recover from
     */
    async initialize(recoveryData?: SlicerRecoveryData[]): Promise<void> {
        await this.setupPromMetrics();
        return super.initialize(recoveryData);
    }

    get apis(): JobAPIInstances {
        return this.api.apis;
    }

    /** The instance of a "Slicer" */
    slicer<T extends SlicerCore = SlicerCore>(): T {
        return this._slicer as T;
    }

    onExecutionStats(stats: ExecutionStats): void {
        this._runMethod('onExecutionStats', stats);
    }

    onSliceEnqueued(slice: Slice): void {
        this._runMethod('onSliceEnqueued', slice);
    }

    onSliceDispatch(slice: Slice): void {
        this._runMethod('onSliceDispatch', slice);
    }

    onSliceComplete(result: SliceResult): void {
        this.slicesComplete++;
        this._runMethod('onSliceComplete', result);
    }

    getSlicesComplete() {
        return this.slicesComplete;
    }

    /**
     * Adds all prom metrics specific to the execution_controller.
     *
     * If trying to add a new metric for the execution_controller, it belongs here.
     * @async
     * @function setupPromMetrics
     * @return {Promise<void>}
     * @link https://terascope.github.io/teraslice/docs/development/k8s#prometheus-metrics-api
     */
    async setupPromMetrics() {
        this.logger.info(`adding ${this.context.assignment} prom metrics...`);
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        await Promise.all([
            this.context.apis.foundation.promMetrics.addGauge(
                'info',
                'Information about Teraslice execution controller',
                ['arch', 'clustering_type', 'name', 'node_version', 'platform', 'teraslice_version'],
            ),
            this.context.apis.foundation.promMetrics.addGauge(
                'slices_complete',
                'Number of slices completed by all workers',
                [],
                function collect() {
                    const slicesComplete = self.getSlicesComplete();
                    const defaultLabels = {
                        ...self.context.apis.foundation.promMetrics.getDefaultLabels()
                    };
                    this.set(defaultLabels, slicesComplete);
                }
            )
        ]);

        this.context.apis.foundation.promMetrics.set(
            'info',
            {
                arch: this.context.arch,
                clustering_type: this.context.sysconfig.teraslice.cluster_manager_type,
                name: this.context.sysconfig.teraslice.name,
                node_version: process.version,
                platform: this.context.platform,
                teraslice_version: this.config.teraslice_version
            },
            1
        );
    }
}
