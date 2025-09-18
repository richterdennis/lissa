export class ConnectionError extends Error {
	constructor(...args) {
		super('ConnectionError', ...args);
		this.name = 'ConnectionError';
	}
}

export class ResponseError extends Error {
	constructor(...args) {
		super('ResponseError', ...args);
		this.name = 'ResponseError';
	}
}
