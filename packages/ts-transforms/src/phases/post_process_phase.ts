
import { DataEntity } from '@terascope/utils';
import _ from 'lodash';
import { OperationConfig, WatcherConfig, ConfigProcessingDict } from '../interfaces';
import PhaseBase from './base';
import { OperationsManager } from '../operations';

export default class PostProcessPhase extends PhaseBase {
    constructor(opConfig: WatcherConfig, configList: ConfigProcessingDict, opsManager: OperationsManager) {
        super(opConfig);

        function loadOp(config: OperationConfig) {
            const opName = config.post_process || config.validation;
            const Op = opsManager.getTransform(opName as string);
            return new Op(config);
        }
        _.forOwn(configList, (operationList, key) => {
            this.phase[key] = operationList.map(loadOp);
        });

        this.hasProcessing = Object.keys(this.phase).length > 0;
    }

    run(dataArray: DataEntity[]): DataEntity[] {
        if (!this.hasProcessing) return dataArray;
        const resultsList: DataEntity[] = [];

        _.each(dataArray, (data) => {
            const startingMetaData = data.getMetadata();
            const { selectors } = startingMetaData;
            let record: DataEntity | null = data;

            _.forOwn(selectors, (_value, key) => {
                if (this.phase[key]) {
                    record = this.phase[key].reduce<DataEntity | null>((record, fn) => {
                        if (!record) return record;
                        return fn.run(record);
                    }, record);
                }
            });

            if (record != null && Object.keys(record).length > 0) {
                const postMetaData = record.getMetadata();
                const finalMetaData = _.merge(postMetaData, startingMetaData);
                _.forOwn(finalMetaData, (value, key) => {
                    // @ts-ignore
                    if (key !== 'createdAt') record.setMetadata(key, value);
                });
                resultsList.push(record);
            }
        });

        return resultsList;
    }
}
