module.exports = {
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  collectCoverage: true,
  collectCoverageFrom: [
    '../*.js',
    '../did/*.js',
    '../edcrypto/*.js',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov','html'],
};
