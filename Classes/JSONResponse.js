export class JSONResponse {
    constructor(data = null, error = null, meta = null) {
        this.data = data;
        this.error = error;
        this.meta = meta;
    }

    static success(data, meta = null) {
        return new json(data, null, meta);
    }

    static error(error, meta = null) {
        return new json(null, error, meta);
    }
}

