export class Dispatch {
    dispatch: Record<string, number> = {};

    set(nodeId: string, numOfWorkers: number) {
        if (this.dispatch[nodeId]) {
            this.dispatch[nodeId] += numOfWorkers;
        } else {
            this.dispatch[nodeId] = numOfWorkers;
        }
    }

    getDispatch = () => this.dispatch;
}
