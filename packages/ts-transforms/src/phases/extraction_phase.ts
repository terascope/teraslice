
import { DataEntity } from '@terascope/utils';
import _ from 'lodash';
import { WatcherConfig, ExtractionProcessingDict } from '../interfaces';
import PhaseBase from './base';
import { OperationsManager } from '../operations';

function hasExtracted(record: DataEntity) {
    return record.getMetadata('hasExtractions') === true;
}

export default class ExtractionPhase extends PhaseBase {

    constructor(opConfig: WatcherConfig, configList:ExtractionProcessingDict, opsManager: OperationsManager) {
        super(opConfig);
        this.opConfig = opConfig;
        const Extraction = opsManager.getTransform('extraction');

        _.forOwn(configList, (operationList, key) => {
            this.phase[key] = [new Extraction(operationList)];
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
            let results = DataEntity.make({}, metaData);

            selectors.forEach((selector: string, index:number, array:string[]) => {
                this.phase[selector].forEach((extraction) => {
                    // @ts-ignore TODO: review me
                    const resultsData = extraction.run(record, results);
                    if (resultsData) results = resultsData;
                });
            });

            if (hasExtracted(results)) {
                resultsList.push(results);
            }
        }

        return resultsList;
    }
}
