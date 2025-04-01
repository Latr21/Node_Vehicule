import { createConnection } from 'mysql2';

export class Database {
    constructor(config) {
        this.connection = createConnection(config);
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.connection.connect((err) => {
                if (err) {
                    reject(`Error connecting to the database: ${err.message}`);
                } else {
                    resolve('Connected to the database.');
                }
            });
        });
    }

    query(sql, params) {
        return new Promise((resolve, reject) => {
            this.connection.query(sql, params, (err, results) => {
                if (err) {
                    reject(`Error executing query: ${err.message}`);
                } else {
                    resolve(results);
                }
            });
        });
    }

    close() {
        return new Promise((resolve, reject) => {
            this.connection.end((err) => {
                if (err) {
                    reject(`Error closing the connection: ${err.message}`);
                } else {
                    resolve('Connection closed.');
                }
            });
        });
    }
}
