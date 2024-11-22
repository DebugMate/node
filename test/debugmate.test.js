const { Context } = require('../context');
const Debugmate = require('../debugmate');
const queryString = require('querystring');

const error = new Error('This is an error');

test('it should initialize Debugmate correctly', () => {
    const debugmate = new Debugmate({
        domain: 'http://debugmate-app.test',
        token: 'token',
        enabled: true,
    });

    expect(debugmate.domain).toBe('http://debugmate-app.test');
    expect(debugmate.token).toBe('token');
    expect(debugmate.enabled).toBe(true);
});

test('it should set user context', () => {
    const debugmate = new Debugmate({});
    const user = { id: 1, name: 'John Doe', email: 'johndoe@email.com' };

    debugmate.setUser(user);

    expect(debugmate.context.user).toEqual(user);
});

test('it should set environment context', () => {
    const debugmate = new Debugmate({});
    const environment = {
        environment: 'local',
        debug: true,
        timezone: 'UTC',
    };

    debugmate.setEnvironment(environment);

    expect(debugmate.context.environment).toEqual(environment);
});

test('it should set request context', () => {
    const debugmate = new Debugmate({});
    const request = {
        url: '/api/v1/users',
        method: 'POST',
        params: { id: '3' },
        headers: { 'Content-Type': 'application/json' },
    };

    debugmate.setRequest(request);

    expect(debugmate.context.request).toEqual(request);
});

test('it should publish an error with full context', () => {
    const debugmate = new Debugmate({
        domain: 'http://debugmate-app.test',
        token: 'token',
        enabled: true,
    });

    const user = { id: 1, name: 'John Doe', email: 'johndoe@email.com' };
    const environment = { environment: 'local', debug: true };
    const request = {
        url: '/api/v1/users',
        method: 'GET',
        params: { id: '3' },
        headers: { 'Content-Type': 'application/json' },
        query: 'id=3',
    };

    debugmate.publish(error, user, environment, request);

    const payload = debugmate.payload(error);

    expect(payload.message).toBe(error.message);
    expect(payload.user).toEqual(user);
    expect(payload.environment).toEqual([
        { group: 'Node', variables: { version: process.version } },
        { group: 'App', variables: environment },
        { group: 'System', variables: { os: 'MacOS', browser: request.headers['user-agent'] } },
    ]);
    expect(payload.request.request.url).toBe(request.url);
});