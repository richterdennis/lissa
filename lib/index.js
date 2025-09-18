import * as exports from './exports.js';
import Lissa from './core/lissa.js';

const defaultLissa = Lissa.create();

const lib = (url, options = {}) => defaultLissa.request({
	method: 'get',
	...options,
	url,
});

export default Object.assign(lib, {
	'create': (...args) => Lissa.create(...args),

	'get': (...args) => defaultLissa.get(...args),
	'post': (...args) => defaultLissa.post(...args),
	'put': (...args) => defaultLissa.put(...args),
	'patch': (...args) => defaultLissa.patch(...args),
	'delete': (...args) => defaultLissa.delete(...args),
	'request': (...args) => defaultLissa.request(...args),

	'upload': (...args) => defaultLissa.upload(...args),
	'download': (...args) => defaultLissa.download(...args),

	...exports,
});

export * from './exports.js';
