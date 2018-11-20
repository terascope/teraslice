export = class SimpleClient {
    fetchRecord(id: number) {
        return {
            id,
            data: [
                Math.random(),
                Math.random(),
                Math.random(),
            ]
        };
    }

    sliceRequest(count: number) {
        return {
            count
        };
    }
};
