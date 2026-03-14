import Lissa, { ExpectedError, Json } from 'lissa';

type Result<V, E extends Error> = [V, undefined] | [undefined, E];

type CustomApiResponse = {
	data: Json;
};

const plainLissa = Lissa.create({
	baseURL: 'https://example.com',
});

const customLissa = Lissa
	.create({
		baseURL: 'https://example.com',
	})
	.onResponse<Result<CustomApiResponse, ExpectedError>>((result) => {
		return [result.data, undefined];
	})
	.onError<Result<CustomApiResponse, ExpectedError>>((error) => {
		return [undefined, error];
	});

const cre1 = await customLissa.get('/data');
const cre2 = await customLissa.get<Result<string, ExpectedError>>('/string');

const [data, error] = cre1;

if (error) {
	console.log(data, error);

	switch (error.name) {
		case 'AbortError': console.log(error); break;
		case 'TimeoutError': console.log(error); break;
		case 'ConnectionError': console.log(error); break;
		case 'ResponseError': console.log(error); break;
		default: console.log(error satisfies never); break;
	}
}
else {
	console.log(data, error);
}

const pre1 = await plainLissa.get('/data');
const pre2 = await plainLissa.get<string>('/string');
