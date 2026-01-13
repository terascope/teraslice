import { DataEntity } from '@terascope/core-utils';
import { hasKeys } from './utils.js';
import { OperationsManager } from '../operations/index.js';
import {
    PostProcessConfig,
    WatcherConfig,
    PostProcessingDict,
    OperationsPipline,
    Operation
} from '../interfaces.js';
import PhaseBase from './base.js';

export default class PostProcessPhase extends PhaseBase {
    constructor(
        opConfig: WatcherConfig,
        configList: PostProcessingDict,
        opsManager: OperationsManager
    ) {
        super(opConfig);

        function loadOp(config: PostProcessConfig) {
            const opName = config.post_process || config.validation;
            const Op = opsManager.getTransform(opName as string);
            return new Op(config);
        }

        Object.entries(configList).forEach(([key, operationList]) => {
            this.phase[key] = operationList.map(loadOp);
        });

        this.hasProcessing = hasKeys(this.phase);
    }

    run(dataArray: DataEntity[]): DataEntity[] {
        if (!this.hasProcessing) return dataArray;
        const resultsList: DataEntity[] = [];

        for (const record of dataArray) {
            const results = runProcessors(this.phase, record, record.getMetadata());
            if (results != null && hasKeys(results)) {
                resultsList.push(results);
            }
        }

        return resultsList;
    }
}

function runProcessors(phase: OperationsPipline, record: DataEntity, metadata: any): MaybeRecord {
    let results: MaybeRecord = record;
    for (const selector of metadata.selectors) {
        const pipeline = phase[selector];
        if (pipeline) results = process(pipeline, results);
    }
    return results;
}

function process(phase: Operation[], record: MaybeRecord): MaybeRecord {
    let results = record;

    for (const op of phase) {
        if (!results) continue;
        results = op.run(results);
    }

    return results;
}

type MaybeRecord = DataEntity | null;
