const { Context } = require('../context');
const queryString = require('querystring');

const error = new Error('This is an error');

test('it should set the user correctly', () => {
    const context = new Context();
    context.setUser({ id: 1, name: 'John Doe', email: 'johndoe@email.com' });

    expect(context.user).toEqual({ id: 1, name: 'John Doe', email: 'johndoe@email.com' });
});

test('it should set the environment correctly', () => {
    const context = new Context();
    context.setEnvironment({
        environment: 'local',
        debug: true,
        timezone: 'UTC',
        server: 'apache',
        database: 'mysql 5.7',
        npm: '6.13.4',
    });

    expect(context.environment).toEqual({
        environment: 'local',
        debug: true,
        timezone: 'UTC',
        server: 'apache',
        database: 'mysql 5.7',
        npm: '6.13.4',
    });
});

test('it should set the request correctly', () => {
    const context = new Context();
    context.setRequest({
        url: '/api/v1/users',
        method: 'GET',
        params: { id: '3' },
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
            host: 'localhost:8000',
        },
        query: 'id=3',
    });

    expect(context.request).toEqual({
        url: '/api/v1/users',
        method: 'GET',
        params: { id: '3' },
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
            host: 'localhost:8000',
        },
        query: 'id=3',
    });
});

test('it should generate the appRequest payload correctly', () => {
    const context = new Context();
    context.setRequest({
        url: '/api/v1/users?id=3',
        method: 'GET',
        params: { id: '3' },
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
            host: 'localhost:8000',
        },
        body: '{"key": "value"}',
    });

    const payload = context.appRequest();
    expect(payload.request.request.url).toEqual('/api/v1/users?id=3');
    expect(payload.request.headers).toEqual({
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
        host: 'localhost:8000',
    });
    expect(payload.request.query_string).toEqual({ id: '3' });
    expect(payload.request.body).toEqual('{"key": "value"}');
});