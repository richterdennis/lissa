import Lissa from '../lib/index.js';

const lissa = Lissa.create({
	// Thank you jsonplaceholder.typicode.com
	baseURL: 'https://jsonplaceholder.typicode.com',
});

lissa.onResponse(async (result) => {
	// Omit params to keep console log small
	delete result.options;
	delete result.request;
	delete result.response;
	delete result.headers;
});

console.log(
	await lissa.get('/posts/1'),
);

console.log(
	await lissa.post('/posts', {
		title: 'foo',
		body: 'bar',
		userId: 1,
	}),
);

console.log(
	await lissa.put('/posts/1', {
		id: 1,
		title: 'foo',
		body: 'bar',
		userId: 1,
	}),
);

console.log(
	await lissa.patch('/posts/1', {
		title: 'foo',
	}),
);

console.log(
	await lissa.delete('/posts/1'),
);

console.log(
	// You can do this
	await lissa.get('/posts').params({ userId: 1 }),

	/* or this
	await lissa.get('/posts', {
		params: {
			userId: 1,
		},
	}),
	*/
);
