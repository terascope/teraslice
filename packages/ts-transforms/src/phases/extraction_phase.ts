
import { DataEntity } from '@terascope/utils';
import _ from 'lodash';
import { WatcherConfig, ConfigProcessingDict } from '../interfaces';
import PhaseBase from './base';
import { OperationsManager } from '../operations';

export default class ExtractionPhase extends PhaseBase {

    constructor(opConfig: WatcherConfig, configList:ConfigProcessingDict, opsManager: OperationsManager) {
        super(opConfig);
        this.opConfig = opConfig;
        const Extraction = opsManager.getTransform('extraction');

        _.forOwn(configList, (operationList, key) => {
            this.phase[key] = operationList.map(config => new Extraction(config));
        });

        this.hasProcessing = Object.keys(this.phase).length > 0;
    }

    run(dataArray: DataEntity[]): DataEntity[] {
        if (!this.hasProcessing) return dataArray;
        const resultsList: DataEntity[] = [];

        for (let i = 0; i < dataArray.length; i += 1) {
            const record = dataArray[i];
            const metaData =  record.getMetadata();
            const { selectors } = metaData;
            const selectorKeys = Object.keys(selectors);
            const results = {};

            selectorKeys.forEach((key) => {
                if (this.phase[key]) {
                    this.phase[key].forEach((fn) => {
                        const newRecord = fn.run(record);
                        if (newRecord) _.merge(metaData, newRecord.getMetadata());
                        return _.merge(results, newRecord);
                    });
                }
            });

            if (Object.keys(results).length > 0) {
                const newRecord = DataEntity.make(results, metaData);
                resultsList.push(newRecord);
            }
        }

        return resultsList;
    }
}
