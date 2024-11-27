class Context {
    constructor() {
        this.processInfo = process;
        this.operatingSystem = this.checkOperationSystem();
    }

    setError(error) {
        this.error = error;
    }

    setRequest(request) {
        this.request = request;
    }

    setUser(user) {
        if (!user || typeof user.id !== 'number' || typeof user.name !== 'string') {
            throw new Error('Invalid user object');
        }
        this.user = user;
    }

    setEnvironment(environment) {
        this.environment = environment;
    }

    checkOperationSystem() {
        const osMapping = {
            darwin: 'MacOS',
            win32: 'Windows',
            linux: 'Linux',
            android: 'Android',
        };
        return osMapping[this.processInfo.platform] || 'Unknown';
    }

    payload() {
        return {
            ...this.appUser(),
            ...this.appRequest(),
            ...this.appEnvironment(),
        };
    }

    appUser() {
        return this.user ? { user: this.user } : {};
    }

    appRequest() {
        if (!this.request) {
            return {
                request: {
                    request: {
                        url: 'unknown',
                        method: 'GET',
                        params: {},
                    },
                    headers: {},
                    query_string: {},
                    body: '',
                },
            };
        }

        const url = this.request.url || 'unknown';
        const queryParams = this.getQueryParams();

        return {
            request: {
                request: {
                    url: url,
                    method: this.request.method || 'GET',
                    params: this.request.params || {},
                },
                headers: this.request.headers || {},
                query_string: queryParams,
                body: this.request.body || '',
            },
        };
    }

    getQueryParams() {
        if (!this.request?.url || !this.request?.headers?.host) {
            return {};
        }

        try {
            const urlObj = new URL(this.request.url, `http://${this.request.headers.host}`);
            const params = {};
            for (const [key, value] of urlObj.searchParams.entries()) {
                params[key] = value;
            }
            return params;
        } catch (err) {
            console.error('Error parsing query string:', err.message);
            return {};
        }
    }

    appEnvironment() {
        return {
            environment: this.filterKeys([
                this.nodeContext(),
                this.appEnvironmentVariables(),
                this.systemContext(),
            ]),
        };
    }

    nodeContext() {
        return this.processInfo.version
            ? { group: 'Node', variables: { version: this.processInfo.version } }
            : {};
    }

    appEnvironmentVariables() {
        const vars = {};
        this.addIfDefined(vars, 'environment', this.environment?.environment);
        this.addIfDefined(vars, 'debug', this.environment?.debug);
        this.addIfDefined(vars, 'timezone', this.environment?.timezone);

        return Object.keys(vars).length ? { group: 'App', variables: vars } : {};
    }

    systemContext() {
        const vars = {
            os: this.operatingSystem,
            server: this.environment?.server,
            database: this.environment?.database,
            npm: this.environment?.npm,
            browser: this.request?.headers?.['user-agent'],
        };

        return { group: 'System', variables: vars };
    }

    addIfDefined(target, key, value) {
        if (value !== undefined) {
            target[key] = value;
        }
    }

    filterKeys(array) {
        return array.filter((item) => Object.keys(item).length > 0);
    }
}

module.exports.Context = Context;