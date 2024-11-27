const Debugmate = require('../debugmate');

describe('Debugmate Tests', () => {
    let debugmate;

    beforeEach(() => {
        debugmate = new Debugmate({
            domain: 'http://debugmate-app.test',
            token: 'token',
            enabled: true,
        });

        jest.spyOn(debugmate, 'publish');
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    test('it should initialize Debugmate correctly', () => {
        expect(debugmate.domain).toBe('http://debugmate-app.test');
        expect(debugmate.token).toBe('token');
        expect(debugmate.enabled).toBe(true);
    });

    test('it should set user context', () => {
        const user = { id: 1, name: 'John Doe', email: 'johndoe@email.com' };
        debugmate.setUser(user);

        expect(debugmate.context.user).toEqual(user);
    });

    test('it should set environment context', () => {
        const environment = {
            environment: 'local',
            debug: true,
            timezone: 'UTC',
        };

        debugmate.setEnvironment(environment);

        expect(debugmate.context.environment).toEqual(environment);
    });

    test('it should set request context', () => {
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
        const user = { id: 1, name: 'John Doe', email: 'johndoe@email.com' };
        const environment = { environment: 'local', debug: true };
        const request = {
            url: '/api/v1/users',
            method: 'GET',
            params: { id: '3' },
            headers: { 'Content-Type': 'application/json' },
        };

        const error = new Error('Test Error');
        debugmate.publish(error, user, environment, request);

        const payload = debugmate.payload(error);

        expect(payload.message).toBe(error.message);
        expect(payload.user).toEqual(user);
        expect(payload.environment).toContainEqual({
            group: 'Node',
            variables: { version: process.version },
        });
        expect(payload.request.request.url).toBe(request.url);
    });

    test('it should set up global error handlers', () => {
        const processOnSpy = jest.spyOn(process, 'on');

        debugmate.setupGlobalErrorHandling();

        expect(processOnSpy).toHaveBeenCalledWith('uncaughtException', expect.any(Function));
        expect(processOnSpy).toHaveBeenCalledWith('unhandledRejection', expect.any(Function));
    });

    test('it should handle uncaught exceptions', () => {
        debugmate.setupGlobalErrorHandling();

        const error = new Error('Test uncaught exception');
        process.emit('uncaughtException', error);

        expect(debugmate.publish).toHaveBeenCalledWith(error);
    });

    test('it should handle unhandled promise rejections', () => {
        debugmate.setupGlobalErrorHandling();

        const rejectionError = new Error('Test unhandled rejection');
        process.emit('unhandledRejection', rejectionError);

        expect(debugmate.publish).toHaveBeenCalledWith(rejectionError);

        const rejectionReason = 'Some reason';
        process.emit('unhandledRejection', rejectionReason);

        expect(debugmate.publish).toHaveBeenCalledWith(
            expect.objectContaining({
                message: `Unhandled rejection: "${rejectionReason}"`,
            })
        );
    });
});