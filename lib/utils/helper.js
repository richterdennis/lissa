export function normalizeOptions(options = {}) {
	const { get = {}, post = {}, put = {}, patch = {}, delete: del = {}, ...defaults } = options;

	function normalize(options) {
		const normalized = { ...options };
		normalized.headers = new Headers(options.headers || {});
		normalized.params = options.params || {};
		return normalized;
	}

	return {
		...normalize(defaults),
		'get': normalize(get),
		'post': normalize(post),
		'put': normalize(put),
		'patch': normalize(patch),
		'delete': normalize(del),
	};
}

export function deepMerge(...objects) {
	let merged;

	for (const obj of objects) {
		if (obj == null) continue;

		if (obj instanceof AbortSignal) {
			if (!merged) merged = obj;
			else merged = AbortSignal.any([merged, obj]);
			continue;
		}

		if (obj instanceof Headers) {
			merged = new Headers(merged);

			obj.forEach((value, key) => {
				merged.set(key, value);
			});

			continue;
		}

		if (Array.isArray(obj)) {
			merged = [...(merged || []), ...obj];
			continue;
		}

		if (typeof obj === 'object' && obj.constructor === Object) {
			merged = merged || {};

			Object.keys(obj).forEach((key) => {
				merged[key] = deepMerge(merged[key], obj[key]);
			});

			continue;
		}

		merged = obj;
	}

	return merged;
}

export function stringToBase64(str) {
	// Browser environment
	if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
		let binary = '';
		new TextEncoder().encode(str).forEach((byte) => {
			binary += String.fromCharCode(byte);
		});
		return window.btoa(binary);
	}

	// Node.js environment
	if (typeof Buffer !== 'undefined') {
		return Buffer.from(str, 'utf-8').toString('base64');
	}

	throw new Error('Base64 encoding not supported in this environment');
}

export function stringifyParams(params, serializer) {
	if (typeof serializer === 'function') return serializer(params);
	if (serializer === 'extended') return extendedParamsSerializer(params);
	return simpleParamsSerializer(params);
}

export function simpleParamsSerializer(params) {

	function stringifyPrimitive(v) {
		switch (typeof v) {
			case 'string': return encodeURIComponent(v);
			case 'number': return Number.isFinite(v) ? `${v}` : '';
			case 'bigint':
			case 'boolean': return `${v}`;
			default: return '';
		}
	}

	function* generator(params) {
		for (const [key, val] of Object.entries(params)) {
			if (Array.isArray(val)) {
				for (const arrVal of val) {
					yield `${encodeURIComponent(key)}=${stringifyPrimitive(arrVal)}`;
				}
			}
			else {
				yield `${encodeURIComponent(key)}=${stringifyPrimitive(val)}`;
			}
		}
	}

	return generator(params).toArray().join('&');
}

export function extendedParamsSerializer(params) {

	function* recursiveGenerator(key, value) {
		if (value === null) {
			return yield `${key}=`;
		}

		const type = typeof value;

		if (type === 'object' && value instanceof Date) {
			yield `${key}=${encodeURIComponent(value.toISOString())}`;
		}
		else if (type === 'object') {
			for (const [subKey, val] of Object.entries(value)) {
				yield* recursiveGenerator(`${key}%5B${encodeURIComponent(subKey)}%5D`, val);
			}
		}
		else if (type === 'string') {
			yield `${key}=${encodeURIComponent(value)}`;
		}
		else if (type === 'number' || type === 'bigint' || type === 'boolean') {
			yield `${key}=${value}`;
		}
	}

	function* startGenerator(params) {
		for (const [key, val] of Object.entries(params)) {
			yield* recursiveGenerator(encodeURIComponent(key), val);
		}
	}

	return startGenerator(params).toArray().join('&');
}

export function resolveCause(error, last) {
	const data = {};

	function* getStack(error) {
		if (!error) return;
		Object.assign(data, error);

		yield error.stack;
		yield* getStack(error.cause);
	}

	error.stack = [
		...getStack(error),
		...getStack(last),
	].join('\nCaused by ');

	delete error.cause;

	Object.entries(data).forEach(([key, value]) => {
		if (key in error || key === 'name') return;
		error[key] = value;
	});

	return error;
}

export function throttle(fn, delay = 50) {
	let lastCall = 0;
	let timeoutId;

	return (...args) => {
		const now = performance.now();

		if (now - lastCall >= delay) {
			lastCall = now;
			fn.apply(this, args);
		}
		else {
			clearTimeout(timeoutId);
			timeoutId = setTimeout(() => {
				lastCall = performance.now();
				fn.apply(this, args);
			}, delay - (now - lastCall));
		}
	};
}
