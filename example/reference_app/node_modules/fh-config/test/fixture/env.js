// ENV variables setup

process.env.TEST_ENV_HOST = 'localhost';
process.env.TEST_ENV_PORT = '7000';
process.env.TEST_ENV_CHILD= 'value';

module.exports = process.env;