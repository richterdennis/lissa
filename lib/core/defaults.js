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
	'responseType': 'json',

	'get': basic(),
	'post': basic(),
	'put': basic(),
	'patch': basic(),
	'delete': basic(),
};
