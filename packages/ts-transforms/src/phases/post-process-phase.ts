
import { DataEntity } from '@terascope/utils';
import _ from 'lodash';
import { hasKeys } from './utils';
import { PostProcessConfig, WatcherConfig, PostProcessingDict, OperationsPipline, Operation } from '../interfaces';
import PhaseBase from './base';
import { OperationsManager } from '../operations';

export default class PostProcessPhase extends PhaseBase {
    constructor(opConfig: WatcherConfig, configList: PostProcessingDict, opsManager: OperationsManager) {
        super(opConfig);

        function loadOp(config: PostProcessConfig) {
            const opName = config.post_process || config.validation;
            const Op = opsManager.getTransform(opName as string);
            return new Op(config);
        }
        _.forOwn(configList, (operationList, key) => {
            this.phase[key] = operationList.map(loadOp);
        });

        this.hasProcessing = hasKeys(this.phase);
    }

    run(dataArray: DataEntity[]): DataEntity[] {
        if (!this.hasProcessing) return dataArray;
        const resultsList: DataEntity[] = [];

        for (let i = 0; i < dataArray.length; i += 1) {
            const record = dataArray[i];
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
    for (let i = 0; i < metadata.selectors.length; i++) {
        const pipeline = phase[metadata.selectors[i]];
        if (pipeline) results = process(pipeline, results);
    }
    return results;
}

function process(phase: Operation[], record: MaybeRecord): MaybeRecord {
    let results = record;
    for (let i = 0; i < phase.length; i++) {
        if (!results) continue;
        results = phase[i].run(results);
    }
    return results;
}

type MaybeRecord = DataEntity<object>|null;
