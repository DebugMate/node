function getUser() {
    const user = {
        id: 1,
        name: 'John test',
        email: 'johndoe@email.com',
    }

    return user
}

function getEnvironment() {
    const environment = {
        environment: 'local',
        debug: true,
        timezone: 'UTC',
        server: 'apache',
        database: 'mysql 5.7',
        npm: '6.13.4',
    }

    return environment
}

module.exports = { getUser, getEnvironment }
