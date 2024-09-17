require('dotenv').config()
const fs = require('fs')
const path = require('path')
const http = require('http')
const https = require('https')
const stackTraceParser = require('./stackTraceParser')
const { Context } = require("./context")

class Debugmate {

    constructor() {
        this.domain = process.env.DEBUGMATE_DOMAIN
        this.token = process.env.DEBUGMATE_TOKEN
        this.enabled = process.env.DEBUGMATE_ENABLED
        this.debugmateContext = process.env.DEBUGMATE_CONTEXT
    }

    publish(error, request) {
        if (!error || !this.enabled || !this.domain || !this.token || this.enabled === 'false') {
            console.log('It was not possible to publish the error to Debugmate. Check if the environment variables are set correctly or if the error is null.')

            return
        }

        const context = new Context()

        const appContext = this.checkAppContext()

        if (appContext && appContext.getUser){
            context.setUser(appContext.getUser())
        }

        if (appContext && appContext.getEnvironment){
            context.setEnvironment(appContext.getEnvironment())
        }

        if (request) {
            context.setRequest(request)
        }

        const protocol = this.domain.startsWith('http://') ? http : https

        this.domain = this.domain.endsWith('/') ? this.domain : this.domain + '/'

        const options = {
            method: 'POST',
            headers: {
                'X-DEBUGMATE-TOKEN': this.token,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            }
        }

        const req = protocol.request(`${this.domain}api/capture`, options, (res) => {
            if (error.message === "Test generated by the Debugmate test command") {
                this.scriptResponse(res)
            }
        })

        req.on("error", (err) => {
            console.log("Error: ", err.message)
        })

        req.write(JSON.stringify(this.payload(error, context)))
        req.end()
    }

    payload(error, context) {
        const trace = this.trace(error)

        let data = {
            exception: error.name,
            message: error.message,
            file: trace[0].file,
            type: 'web',
            trace: trace
        }

        if (context) {
            context.setError(error)
            data = {...data, ...context.payload()}
        }

        return data
    }

    trace(error) {
        let stackTrace = stackTraceParser.parse(error)

        return [
            {
                file: stackTrace.sources[0].file,
                line: stackTrace.sources[0].line,
                column: stackTrace.sources[0].column,
                function: stackTrace.sources[0].function,
                class: stackTrace.sources[0].file,
                preview: stackTrace.stack.split('\n'),
            }
        ]
    }

    scriptResponse(res) {
        res.statusCode == 201
            ? console.log('Debugmate reached successfully. We sent a test Exception that has been registered.')
            : console.log('We couldn\'t reach Debugmate Server at ' + this.domain + ' with this token: ' + this.token)
    }

    checkAppContext() {
        const pathFile = this.debugmateContext || path.resolve(__dirname, '../../debugmateContext.cjs')

        return fs.existsSync(pathFile)
            ? require(pathFile)
            : null
    }
}

module.exports = new Debugmate
