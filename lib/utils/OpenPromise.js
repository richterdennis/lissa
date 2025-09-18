export default class OpenPromise extends Promise {
	#resolveSelf;
	#rejectSelf;

	#listeners;

	#status;
	#value;
	#reason;

	constructor(executor = () => {}) {
		let resolve, reject;
		super((res, rej) => {
			resolve = res;
			reject = rej;
			return executor(res, rej);
		});
		this.#resolveSelf = resolve;
		this.#rejectSelf = reject;

		this.#listeners = new Map([
			['resolve', new Set()],
			['reject', new Set()],
			['settle', new Set()],
		]);

		this.#status = 'pending';
	}

	get status() {
		return this.#status;
	}

	get value() {
		return this.#value;
	}

	get reason() {
		return this.#reason;
	}

	on(event, listener) {
		this.#listeners.get(event)?.add(listener);
		return this;
	}

	off(event, listener) {
		this.#listeners.get(event)?.delete(listener);
		return this;
	}

	#emit(event, value) {
		this.#listeners.get(event).forEach(listener => listener(value));
	}

	resolve(value) {
		if (this.#status !== 'pending') return;

		this.#status = 'fulfilled';
		this.#value = value;

		this.#emit('resolve', value);
		this.#emit('settle', {
			status: 'fulfilled',
			value,
		});

		this.#resolveSelf(value);
		this.#listeners.clear();
	}

	reject(reason) {
		if (this.#status !== 'pending') return;

		this.#status = 'rejected';
		this.#reason = reason;

		this.#emit('reject', reason);
		this.#emit('settle', {
			status: 'rejected',
			reason,
		});

		this.#rejectSelf(reason);
		this.#listeners.clear();
	}

}
