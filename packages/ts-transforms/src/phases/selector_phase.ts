
import { DataEntity } from '@terascope/utils';
import _ from 'lodash';
import { WatcherConfig, Operation } from '../interfaces';
import PhaseBase from './base';
import { OperationsManager } from '../operations';

export default class SelectionPhase extends PhaseBase {
    private opConfig: WatcherConfig;
    readonly selectionPhase: Operation[];

    constructor(opConfig: WatcherConfig, selectorList:string[], opsManager: OperationsManager) {
        super();
        this.opConfig = opConfig;
        const Selector = opsManager.getTransform('selector');
        this.selectionPhase = selectorList.map(selector => new Selector({ selector }, this.opConfig.types));
    }

    public run(data: DataEntity[]): DataEntity[] {
        if (this.selectionPhase.length > 0) {
            const results = [];
            for (let i = 0; i < data.length; i += 1) {
                const record = data[i];
                for (let j = 0; j < this.selectionPhase.length; j += 1) {
                    this.selectionPhase[j].run(record);
                }
                const recordMeta = record.getMetadata('selectors');
                if (recordMeta) {
                    results.push(record);
                }
            }
            return results;
        }

        return [];
    }
}
