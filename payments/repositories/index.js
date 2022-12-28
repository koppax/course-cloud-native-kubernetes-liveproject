let makeRedisClient = (config) => {

    const redis = require("async-redis")
    const options = {
        host: config.redis_host,
        port: config.redis_port,
        auth_pass: config.redis_pwd
    }
    console.log('Starting Redis')
    return redis.createClient(options)
}

module.exports = (config) => {

    const client = makeRedisClient(config)
    const paymentsRepo = require('./PaymentsRepository')(client)

    return {paymentsRepository: paymentsRepo}
}
