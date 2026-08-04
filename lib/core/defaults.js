const basic = (headers = {}, params = {}) => ({
	headers: new Headers(headers),
	params,
});

export default {
	'adapter': 'fetch',
	'method': 'get',
	'headers': new Headers({
		'Content-Type': 'application/json',
	}),
	'params': {},
	'paramsSerializer': 'simple',
	'urlBuilder': 'simple',
	'rejectUnsafeUrl': undefined,
	'responseType': 'json',
	'replacer': undefined,
	'reviver': undefined,

	'get': basic(),
	'post': basic(),
	'put': basic(),
	'patch': basic(),
	'delete': basic(),
};
