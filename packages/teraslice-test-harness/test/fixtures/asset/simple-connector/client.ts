export default class SimpleClient {
    fetchRecord(id: number): { id: number; data: number[] } {
        return {
            id,
            data: [
                Math.random(),
                Math.random(),
                Math.random(),
            ]
        };
    }

    sliceRequest(count: number): { count: number } {
        return {
            count
        };
    }

    isFinished(): boolean {
        return false;
    }
}
