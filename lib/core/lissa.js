import LissaRequest from './request.js';
import { deepMerge, normalizeOptions } from '../utils/helper.js';

const type = Symbol('type');

export default class Lissa {
	#options;
	#hooks;

	static create(...args) {
		if (args[0] && typeof args[0] !== 'string') args.unshift(null);
		const [baseURL = null, options = {}] = args;

		if (baseURL) options.baseURL = baseURL;

		return new Lissa(options);
	}

	constructor(options = {}) {
		this.#options = normalizeOptions(options);
		this.#hooks = new Set();
	}

	get options() {
		return this.#options;
	}

	get beforeRequestHooks() {
		return this.#hooks.values().filter(l => l[type] === 'beforeRequest');
	}

	get beforeFetchHooks() {
		return this.#hooks.values().filter(l => l[type] === 'beforeFetch');
	}

	get responseHooks() {
		return this.#hooks.values().filter(l => l[type] === 'onResponse');
	}

	get errorHooks() {
		return this.#hooks.values().filter(l => l[type] === 'onError');
	}

	use(plugin) {
		plugin(this);
		return this;
	}

	beforeRequest(hook) {
		hook[type] = 'beforeRequest';
		this.#hooks.add(hook);
		return this;
	}

	beforeFetch(hook) {
		hook[type] = 'beforeFetch';
		this.#hooks.add(hook);
		return this;
	}

	onResponse(hook) {
		hook[type] = 'onResponse';
		this.#hooks.add(hook);
		return this;
	}

	onError(hook) {
		hook[type] = 'onError';
		this.#hooks.add(hook);
		return this;
	}

	extend(options) {
		options = normalizeOptions(options);
		options = deepMerge(this.#options, options);

		const newInstance = new Lissa(options);
		newInstance.#hooks = new Set(this.#hooks);
		return newInstance;
	}

	authenticate(username, password) {
		return this.extend({
			authenticate: { username, password },
		});
	}

	get(url, options = {}) {
		return LissaRequest.init(this, {
			...options,
			method: 'get',
			url,
		});
	}

	post(url, body, options = {}) {
		return LissaRequest.init(this, {
			...options,
			method: 'post',
			url,
			body,
		});
	}

	put(url, body, options = {}) {
		return LissaRequest.init(this, {
			...options,
			method: 'put',
			url,
			body,
		});
	}

	patch(url, body, options = {}) {
		return LissaRequest.init(this, {
			...options,
			method: 'patch',
			url,
			body,
		});
	}

	delete(url, options = {}) {
		return LissaRequest.init(this, {
			...options,
			method: 'delete',
			url,
		});
	}

	request(options = {}) {
		return LissaRequest.init(this, { ...options });
	}

	upload(file, ...args) {
		const url
			= args.find(arg => typeof arg === 'string') || '';

		const onProgress
			= args.find(arg => typeof arg === 'function') || null;

		const options
			= args.find(arg => typeof arg === 'object') || {};

		if (url) options.url = url;
		if (onProgress) options.onUploadProgress = onProgress;

		// Upload with progress tracking to an http/1.1 server is unfortunately not
		// support yet with fetch in a browser so we set adapter to xhr for now.
		// Upload with process tracking to an http/2 server is experimental. Feel
		// free to test an http/2 upload by setting adapter explicitly to "fetch"
		if (onProgress && !options.adapter && typeof window !== 'undefined') {
			options.adapter = 'xhr';
		}

		return LissaRequest.init(this, {
			method: 'post',
			...options,
			body: file,
		});
	}

	download(...args) {
		const url
			= args.find(arg => typeof arg === 'string') || '';

		const onProgress
			= args.find(arg => typeof arg === 'function') || null;

		const options
			= args.find(arg => typeof arg === 'object') || {};

		if (url) options.url = url;
		if (onProgress) options.onDownloadProgress = onProgress;

		return LissaRequest.init(this, {
			method: 'get',
			responseType: 'file',
			...options,
		});
	}
}
