const queryString = require('querystring')

class Context {

    setError(error) {
        this.error = error
        return this
    }

    setRequest(request) {
        this.request = request
        return this
    }

    setUser(user) {
        this.user = user
        return this
    }

    setEnvironment(environment) {
        this.environment = environment
        return this
    }

    setProcess(process) {
        this.process = process
        return this
    }

    get getProcess() {
        return this.process || process
    }

    checkOperationSystem() {
        const osValue = this.getProcess.platform

        let operationalSystem = {
            'darwin': 'MacOS',
            'win32': 'Windows',
            'linux': 'Linux',
            'android': 'Android',
        }

        return operationalSystem[osValue] || 'Unknown'
    }

    payload() {
        return {
            ...this.appUser(),
            ...this.appRequest(),
            ...this.appEnvironment(),
        }
    }

    appUser() {
        return this.user
            ? {user: this.user}
            : {}
    }

    appRequest() {
        if (this.request) {
            return {
                request : {
                    request: {
                        url: this.request.baseUrl ? this.request.baseUrl : this.request.url,
                        method: this.request.method,
                        params: this.request.params,
                    },
                    headers: this.request.headers,
                    query_string: this.error.sql
                        ? queryString.parse(this.error.sql)
                        : queryString.parse(this.request.query),
                    body: this.request.body ? this.request.body : '',
                }
            }
        }

        return {}
    }

    appEnvironment() {
        let nodeContext = {}

        if (this.getProcess.version) {
            nodeContext = {
                group: 'Node',
                variables: {
                    version: this.getProcess.version,
                }
            }
        }

        let environmentVariables = {}

        if (this.environment?.environment) {
            Object.assign(environmentVariables, {environment: this.environment.environment})
        }

        if (this.environment?.debug) {
            Object.assign(environmentVariables, {debug: this.environment.debug})
        }

        if (this.environment?.timezone) {
            Object.assign(environmentVariables, {timezone: this.environment.timezone})
        }

        let environmentContext = {}

        if (Object.keys(environmentVariables).length > 0) {
            environmentContext = {
                group: 'App',
                variables: environmentVariables,
            }
        }

        let systemVariables = {}

        const operationSystem = this.checkOperationSystem()

        if (operationSystem) {
            Object.assign(systemVariables, {os: operationSystem})
        }

        if (this.environment?.server) {
            Object.assign(systemVariables, {server: this.environment.server})
        }

        if (this.environment?.database) {
            Object.assign(systemVariables, {database: this.environment.database})
        }

        if (this.environment?.npm) {
            Object.assign(systemVariables, {npm: this.environment.npm})
        }

        const browser = this.request?.headers ? this.request?.headers['user-agent'] : ''

        if (browser) {
            Object.assign(systemVariables, {browser})
        }

        let systemContext =  {
            group: 'System',
            variables: systemVariables,
        }

        return {
            environment: this.filterKeys([nodeContext, environmentContext, systemContext])
        }
    }

    filterKeys(array) {
        return array.filter(value => Object.keys(value).length !== 0)
    }
}

module.exports.Context = Context
