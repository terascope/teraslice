import { DataEntity } from './data-entity';

/**
 * Acts as an array of DataEntities associated to a particular key or time frame.
 * A `DataWindow` should be able to be used in-place of an array in most cases.
 */
export class DataWindow<T extends DataEntity = DataEntity> extends Array<T> {
    /**
     * A utility for safely creating a `DataWindow`
     */
    static make(input: DataEntity[]|DataWindow, key?: string): DataWindow {
        if (DataWindow.isDataWindow(input)) {
            return input;
        }
        const window = new DataWindow(...input);
        if (key) {
            window.setKey(key);
        }
        return window;
    }

    static isDataWindow(input: any): input is DataWindow {
        return input instanceof DataWindow;
    }

    /**
     * Get the metadata for the `DataWindow`.
     *
     * If a field is specified, it will get that property of the metadata
    */
    getMetadata(_key?: string) {}

    /**
     * Given a field and value set the metadata on the record
    */
    setMetadata(_key: string, _val: any) {}

    /**
     * Get the unique `_key` for the window
     *
     * If no `_key` is found, an error will be thrown
    */
    getKey() {}

    /**
     * Set the unique `_key` for the window
     *
     * If no `_key` is found, an error will be thrown
    */
    setKey(_key: string|number) {}

    /**
     * Get the time at which this window was created.
    */
    getCreateTime(): Date {
        return new Date();
    }

    /**
     * Get the window start time
     *
     * If none is found, `undefined` will be returned.
     * If an invalid date is found, `false` will be returned.
    */
    getStartTime(): Date|false|undefined {
        return undefined;
    }

    /**
     * Set the window start time
     *
     * If the value is empty it will set the time to now.
     * If an invalid date is given, an error will be thrown.
     */
    setStartTime(_val?: string|number|Date): void {}

    /**
     * Get the window completion time
     *
     * If none is found, `undefined` will be returned.
     * If an invalid date is found, `false` will be returned.
    */
    getFinishTime(): Date|false|undefined {
        return undefined;
    }

    /**
     * Set the window completion time
     *
     * If the value is empty it will set the time to now.
     * If an invalid date is given, an error will be thrown.
     */
    setFinishTime(_val?: string|number|Date): void {}
}
