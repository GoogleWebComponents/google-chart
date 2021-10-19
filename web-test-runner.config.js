// https://modern-web.dev/docs/test-runner/cli-and-configuration/
export default {
  files: 'test/**/*test*.(html|js)',
  nodeResolve: true,
  testFramework: {
    // https://mochajs.org/api/mocha
    config: {
      ui: 'tdd',
      timeout: '20000', // default 2000
    },
  },
};
