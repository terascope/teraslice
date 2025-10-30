export default class FakeDataEntity {
    constructor(d, m) {
        this.metadata = Object.assign({}, m, { _createTime: Date.now() });

        Object.assign(this, d);
    }

    getMetadata(key) {
        return this.metadata[key];
    }

    setMetadata(key, val) {
        this.metadata[key] = val;
    }
}
