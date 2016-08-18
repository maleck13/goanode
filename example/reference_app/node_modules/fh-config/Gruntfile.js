'use strict';

module.exports = function(grunt) {
  require('time-grunt')(grunt);

  // dist related variables
  var pkgName = 'fh-config';
  var distDir = './dist';
  var outputDir = './output';
  var pkgjs = require('./package.json');
  var buildNumber = (process.env['BUILD_NUMBER'] || 'BUILD-NUMBER');
  var packageVersion = pkgjs.version + '-' + buildNumber;
  var releaseDir = pkgName + '-' + packageVersion;
  var releaseFile = pkgName + '-' + packageVersion + '.tar.gz';

  // Project Configuration
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    env : {
      options : {},
      // environment variables - see https://github.com/jsoverson/grunt-env for more information
      local: {
        FH_USE_LOCAL_DB: true
      }
    },
    shell: {
      unit: {
        options: {
          stdout: true,
          stderr: true,
          failOnError: true,
          execOptions: {
            maxBuffer: 1048576
          }
        },
        command: './node_modules/.bin/_mocha -A -u exports --recursive -t 10000 test/unit/'
      },
      coverage_unit: {
        options: {
          stdout: true,
          stderr: true,
          failOnError: true,
          execOptions: {
            maxBuffer: 1048576
          }
        },
        command: [
          'rm -rf coverage cov-unit',
          './node_modules/.bin/istanbul cover --dir cov-unit _mocha -- -A -u exports --recursive -t 10000  test/unit',
          './node_modules/.bin/istanbul report',
          './node_modules/.bin/istanbul report --report cobertura',
          'echo "See html coverage at: `pwd`/coverage/lcov-report/index.html"'
        ].join('&&')
      },
      dist: {
        options: {
          stdout: true,
          stderr: true,
          failOnError: true
        },
        command: [
          'rm -rf ' + distDir + ' ' + outputDir + ' ' + releaseDir,
          'mkdir -p ' + distDir + ' ' + outputDir + '/' + releaseDir,
          'cp -r ./lib ' + outputDir + '/' + releaseDir,
          'cp ./package.json ' +  outputDir + '/' + releaseDir,
          'cp ./index.js ' +  outputDir + '/' + releaseDir,
          'cp ./ReadMe.md ' +  outputDir + '/' + releaseDir,
          'echo ' +  packageVersion + ' > ' + outputDir + '/' + releaseDir + '/VERSION.txt',
          'tar -czf ' + distDir + '/' + releaseFile + ' -C ' + outputDir + ' ' + releaseDir
        ].join('&&')
      }
    }
  });

  // Load NPM tasks
  require('load-grunt-tasks')(grunt, {scope: 'devDependencies'});

  // Testing tasks
  grunt.registerTask('unit', ['eslint', 'shell:unit']);
  grunt.registerTask('test', ['unit']);

  // Coverage tasks
  grunt.registerTask('coverage', ['eslint', 'shell:coverage_unit']);

  // dist command
  grunt.registerTask('dist', ['shell:dist']);

  // Making grunt default to force in order not to break the project.
  grunt.option('force', true);

  grunt.registerTask('default', ['test', 'dist']);
};
