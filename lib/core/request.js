import defaults from './defaults.js';
import { ConnectionError, ResponseError } from './errors.js';
import OpenPromise from '../utils/OpenPromise.js';
import { resolveCause, deepMerge, stringifyParams, stringToBase64, throttle } from '../utils/helper.js';

export default class LissaRequest extends OpenPromise {

	static init(lissa, options) {
		const request = new LissaRequest();
		request.#init(lissa, options);

		const keepStack = new Error();
		keepStack.name = 'Code';

		setTimeout(async () => {
			try {
				const response = await request.#execute();
				request.resolve(response);
			}
			catch (err) {
				request.reject(resolveCause(err, keepStack));
			}
		}, 1);

		return request;
	}

	#lissa;
	#options;
	#locked;

	#init(lissa, options) {
		this.#lissa = lissa;

		if (options.headers) options.headers = new Headers(options.headers);
		this.#options = options;

		this.#locked = false;
	}

	get options() {
		return this.#options;
	}

	baseURL(baseURL) {
		return this.#addOptions({ baseURL });
	}

	url(url) {
		return this.#addOptions({ url });
	}

	method(method) {
		return this.#addOptions({ method });
	}

	headers(headers) {
		return this.#addOptions({ headers });
	}

	authenticate(username, password) {
		return this.#addOptions({
			authenticate: { username, password },
		});
	}

	params(params) {
		return this.#addOptions({ params });
	}

	body(body) {
		return this.#addOptions({ body });
	}

	timeout(timeout) {
		return this.#addOptions({ timeout });
	}

	signal(signal) {
		return this.#addOptions({ signal });
	}

	responseType(responseType) {
		return this.#addOptions({ responseType });
	}

	onUploadProgress(onProgress) {
		return this.#addOptions({ onUploadProgress: onProgress });
	}

	onDownloadProgress(onProgress) {
		return this.#addOptions({ onDownloadProgress: onProgress });
	}

	#addOptions(options) {
		if (this.#locked) {
			console.warn(new Error('Request options cannot be changed anymore after execution start!'));
			return;
		}

		if (options.headers) options.headers = new Headers(options.headers);
		this.#options = deepMerge(this.#options, options);
		return this;
	}

	async #execute() {
		this.#locked = true;
		const lissa = this.#lissa;

		// Build options

		const method = (this.#options.method || lissa.options.method || defaults.method).toLowerCase();

		let {
			get: _get, // omit
			post: _post, // omit
			put: _put, // omit
			patch: _patch, // omit
			delete: _del, // omit
			...options
		} = deepMerge(
			defaults,
			defaults[method],
			lissa.options,
			lissa.options[method],
			this.#options,
		);

		for (const hook of lissa.beforeRequestHooks) {
			options = await hook.call(this, options) || options;
		}

		const $options = {
			...options,
		};

		// Build fetch request

		if (options.authenticate) {
			const { username, password } = options.authenticate;
			delete options.authenticate;

			const auth = stringToBase64(`${username}:${password}`);
			options.headers.set('Authorization', `Basic ${auth}`);
		}

		if (options.params) {
			const params = stringifyParams(options.params, options.paramsSerializer);
			delete options.paramsSerializer;

			options.params = params ? `?${params}` : '';
		}

		if (options.body != null) {
			if (options.body instanceof Blob && options.body.type && !this.#options.headers?.has('Content-Type')) {
				options.headers.delete('Content-Type');
			}
			else if (options.body instanceof FormData) {
				options.headers.delete('Content-Type');
			}
			else if (options.body instanceof URLSearchParams) {
				options.headers.set('Content-Type', 'application/x-www-form-urlencoded');
			}
			else if (options.body.constructor === Object) {
				options.body = JSON.stringify(options.body);
			}
		}
		else {
			options.headers.delete('Content-Type');
		}

		if (options.timeout) {
			if (options.signal) {
				options.signal = AbortSignal.any([
					options.signal,
					AbortSignal.timeout(options.timeout),
				]);
			}
			else {
				options.signal = AbortSignal.timeout(options.timeout);
			}

			delete options.timeout;
		}

		let baseURL, url, params, urlBuilder, adapter;
		({ baseURL, url, params, urlBuilder, adapter, ...options } = options);

		const fetchUrl = ((
			baseURL,
			url,
			urlBuilder,
		) => {
			if (typeof urlBuilder === 'function') return urlBuilder(url, baseURL);
			if (urlBuilder === 'extended') return new URL(url, baseURL || undefined);
			return `${baseURL || ''}${url}`;
		})(
			baseURL,
			`${url || ''}${params || ''}`,
			urlBuilder,
		);

		options.method = method.toUpperCase();

		// Actual fetch
		let returnValue = adapter === 'xhr'
			? await this.#executeXhr({ url: new URL(fetchUrl), ...options })
			: await this.#executeFetch({ url: new URL(fetchUrl), ...options });

		returnValue.options = $options;

		// finish

		const hooks = returnValue instanceof Error
			? lissa.errorHooks
			: lissa.responseHooks;

		for (const hook of hooks) {
			const newReturn = await hook.call(this, returnValue);

			if (newReturn !== undefined) {
				returnValue = newReturn;
				break;
			}
		}

		if (returnValue instanceof Error) throw returnValue;
		return returnValue;
	}

	async #executeFetch({ url, responseType, onUploadProgress, onDownloadProgress, ...options }) {
		let request = { url, options };

		for (const hook of this.#lissa.beforeFetchHooks) {
			request = await hook.call(this, request) || request;
		}

		let fetchRequest = new Request(request.url, request.options);

		if (onUploadProgress && fetchRequest.body && request.options.body) {

			// To track the upload progress we can only do it with Streams and track
			// the byte flow. This only actually track bytes read not bytes send
			// and is overall not a good solution.

			// In Browsers upload a ReadableStream to an http/1.1 server is
			// also not support yet with fetch. Upload a ReadableStream to an
			// http/2 server is experimental due to the required option duplex which
			// is experimental.

			// The funny part is fetchRequest.body is already a ReadableStream no
			// matter the http version and fetchRequest.duplex is already 'half'.
			// And setting it again to a ReadableStream requires duplex to be set
			// to 'half' again and now uploading to http/1.1 is not working anymore :D

			// Pls can we get actual progress events for fetch :)

			const { body } = request.options;
			const total = body.byteLength || body.size || body.length;
			const trackProgressBridge = createTrackProgressBridge(total, onUploadProgress);

			fetchRequest = new Request(fetchRequest, {
				duplex: 'half',
				body: fetchRequest.body.pipeThrough(trackProgressBridge),
			});
		}

		let returnValue;

		try {
			const response = await fetch(fetchRequest).catch((error) => {
				if (error.name === 'TypeError') {
					throw new ConnectionError({ cause: error });
				}

				throw error;
			});

			// Explicit zero content length allows for skipping body parsing
			const hasContent = response.headers.get('Content-Length') !== '0' && !!response.body;

			let data = hasContent ? response.body : null;

			if (data && onDownloadProgress) {
				const total = +response.headers.get('Content-Length');
				const trackProgressBridge = createTrackProgressBridge(total, onDownloadProgress);
				data = data.pipeThrough(trackProgressBridge);
			}

			if (data) {
				switch (responseType) {
					case 'text':
						data = await streamToText(data);
						break;
					case 'json':
						data = await streamToText(data);
						if (!data) break;

						try {
							data = JSON.parse(data);
						}
						catch (error) {
							data = null;
							console.error(error);
						}
						break;
					case 'file':
						data = await streamToFile(response.headers, data);
						break;
				}
			}

			returnValue = response.ok ? {} : new ResponseError();
			returnValue.response = response;
			returnValue.headers = response.headers;
			returnValue.status = response.status;
			returnValue.data = hasContent && data || null;
		}
		catch (error) {
			// error should be one of ConnectionError, AbortError or TimeoutError
			returnValue = error;
		}

		returnValue.request = request;

		return returnValue;
	}

	async #executeXhr({ url, ...options }) {
		let request = { url, options };

		for (const hook of this.#lissa.beforeFetchHooks) {
			request = await hook.call(this, request) || request;
		}

		({ url, options } = request);

		if (options.signal?.aborted) return options.signal.reason || new DOMException('This operation was aborted', 'AbortError');

		const xhr = new XMLHttpRequest();
		xhr.open(options.method, url);

		const responsePromise = new Promise((resolve, reject) => {
			xhr.addEventListener('loadend', () => {
				const { status } = xhr;

				const headers = new Headers();
				xhr.getAllResponseHeaders()?.trim().split(/[\r\n]+/).forEach((line) => {
					const parts = line.split(': ');
					const name = parts.shift();
					const value = parts.join(': ');
					if (name) {
						headers.append(name, value);
					}
				});

				resolve({
					ok: status === 0 || (status >= 200 && status < 400),
					status,
					headers,
					body: xhr.response,
				});
			});

			xhr.addEventListener('abort', () => {
				reject(options.signal?.reason || new DOMException('This operation was aborted', 'AbortError'));
			});

			xhr.addEventListener('error', () => {
				reject(new ConnectionError());
			});
		});

		options.headers.forEach((value, name) => xhr.setRequestHeader(name, value));

		if (options.credentials === 'include') xhr.withCredentials = true;

		if (options.signal) options.signal.addEventListener('abort', () => xhr.abort());

		xhr.responseType = options.responseType === 'raw' || options.responseType === 'file' ? 'blob' : options.responseType;

		if (options.onUploadProgress) {
			xhr.upload.addEventListener('progress', (evt) => {
				options.onUploadProgress(evt.loaded, evt.total);
			});
		}

		if (options.onDownloadProgress) {
			xhr.addEventListener('progress', (evt) => {
				options.onDownloadProgress(evt.loaded, evt.total);
			});
		}

		let returnValue;

		try {
			xhr.send(options.body);

			const response = await responsePromise;

			returnValue = response.ok ? {} : new ResponseError();
			returnValue.response = xhr;
			returnValue.headers = response.headers;
			returnValue.status = response.status;
			returnValue.data = response.body;

			if (options.responseType === 'file') {
				const type = response.headers.get('Content-Type');
				const filename = getFilenameFromContentDisposition(response.headers.get('Content-Disposition'));

				returnValue.data = new File([response.body], filename, {
					'type': type,
				});
			}
		}
		catch (error) {
			// error should be one of ConnectionError, AbortError or TimeoutError
			returnValue = error;
		}

		returnValue.request = request;

		return returnValue;
	}
}

function createTrackProgressBridge(total, onProgress = () => {}) {
	const throttledOnProgress = throttle(onProgress);

	let bytes = 0;
	return new TransformStream({
		transform(chunk, controller) {
			controller.enqueue(chunk);
			bytes += chunk.byteLength;
			throttledOnProgress(bytes, total);
		},
	});
}

async function streamToFile(headers, stream) {
	const type = headers.get('Content-Type');
	const filename = getFilenameFromContentDisposition(headers.get('Content-Disposition'));

	const chunks = await streamToBuffer(stream);

	return new File(chunks, filename, {
		'type': type,
	});
}

async function streamToText(stream) {
	stream = stream.pipeThrough(new TextDecoderStream());
	const chunks = await streamToBuffer(stream);

	return chunks.length ? chunks.join('') : null;
}

async function streamToBuffer(stream) {
	const reader = stream.getReader();
	const chunks = [];
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		chunks.push(value);
	}
	return chunks;
}

function getFilenameFromContentDisposition(header) {
	if (!header) return null;

	const parts = header.split(';').slice(1);

	for (const part of parts) {
		const [key, value] = part.split('=').map(s => s.trim());

		if (key.toLowerCase() === 'filename' && value) {
			if (value.startsWith('"') && value.endsWith('"')) {
				const inner = value.slice(1, -1);
				return inner.replace(/\\(.)/g, '$1');
			}

			return value;
		}
	}

	return null;
}
