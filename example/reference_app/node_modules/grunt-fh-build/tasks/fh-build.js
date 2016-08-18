/*
 Copyright 2015 Red Hat, Inc.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */
var path = require('path');
var findup = require('findup-sync');
var _ = require('lodash');
var fs = require('fs');


module.exports = function(grunt) {
  'use strict';

  require('time-grunt')(grunt);

  var tasksDir;
  var dependencies = require('../package.json').dependencies;
  var basepath = path.resolve(__dirname, '..');

  for (var dependency in dependencies) {
    if (dependency.indexOf('grunt-') === 0) {
      tasksDir = findup(path.join('node_modules', dependency, 'tasks'),
                        {cwd: basepath});
      if (tasksDir) {
        grunt.loadTasks(tasksDir);
      }
    }
  }

  /**
   * If grunt config contains an array property called 'fhignore',
   * its elements will be excluded from the tarball.
   */
  var mergePatterns = function(bundle_deps) {
    var patterns = [
      '**',
      '!dist/**',
      '!plato/**',
      '!cov-*/**',
      '!test*/**',
      '!config/**',
      '!output/**',
      '!coverage/**',
      '!node_modules/**',
      '!package.json', // this will be processed
      '!Gruntfile.js',
      '!Makefile',
      '!makefile',
      '!npm-debug.log',
      '!*.sublime-project',
      '!sonar-project.properties',
      '!**/*.tar.gz'
    ];
    if (bundle_deps) {
      _.map(_.keys(grunt.file.readJSON('package.json').dependencies),
            function(dep) {
              patterns.push('node_modules/' + dep + '/**');
              return dep;
            });
    }

    var fhignore = grunt.config.get('fhignore');
    var extras = [];
    if (fhignore && _.isArray(fhignore)) {
      extras = fhignore.map(function(elem) {
        return '!' + elem;
      });
    }
    Array.prototype.push.apply(patterns, extras);
    var fhinclude = grunt.config.get('fhinclude');
    extras = [];
    if(fhinclude && _.isArray(fhinclude)) {
      extras = fhinclude;
    }
    Array.prototype.push.apply(patterns, extras);
    grunt.log.debug("Patterns: " + patterns);
    return patterns;
  };

  grunt.config.merge({
    env: {
      fh: {
        options: {
          unshift: {
            NODE_PATH: '.:./lib:./testlib:',
            PATH: './node_modules/.bin:',
            delimiter: ':'
          }
        }
      }
    }
  });

  var lintTarget = grunt.config.get('fhLintTarget') || ['*.js', 'lib/**/*.js', 'bin/**/*.js'];
  grunt.config.merge({
    eslint: {
      options: {
        configFile: '.eslintrc.json'
      },
      target: lintTarget
    }
  });

  grunt.config.merge({
    clean: {
      'fh-cov': ['coverage', 'lib-cov', 'cov-*'],
      'fh-dist': ['dist', 'output'],
      'fh-main': ['lib-cov', 'cov-*', 'coverage', '.tmp']
    }
  });

  grunt.config.merge({
    copy: {
      'fh-dist': {
        src: 'package.json',
        dest: 'output/<%= fhbuildver %>/package.json',
        options: {
          process: function(content) {
            return content.replace(/BUILD\-NUMBER/,
                                   grunt.config.get('fhbuildnum'));
          }
        }
      }
    }
  });

  grunt.config.merge({
    compress: {
      'fh-dist': {
        options: {
          mode: 'tgz',
          archive: 'dist/<%= fhpkg.name %>-<%= fhbuildver %>.tar.gz'
        },
        files: [
          {
            // Everything except exclusions
            expand: true,
            src: mergePatterns(false),
            dest: '<%= fhpkg.name %>-<%= fhbuildver %>'
          },
          {
            // Files that are processed
            expand: true,
            cwd: 'output/<%= fhbuildver %>/',
            src: ['*'],
            dest: '<%= fhpkg.name %>-<%= fhbuildver %>'
          }
        ]
      },
      'fh-dist-deps': {
        options: {
          mode: 'tgz',
          archive: 'dist/<%= fhpkg.name %>-<%= fhbuildver %>-<%= fhos %>.'
            + process.arch + '.tar.gz'
        },
        files: [
          {
            // Everything except exclusions
            expand: 'true',
            src: mergePatterns(true),
            dest: '<%= fhpkg.name %>-<%= fhbuildver %>-<%= fhos %>.' + process.arch
          },
          {
            // Files that are processed
            expand: true,
            cwd: 'output/<%= fhbuildver %>/',
            src: ['*'],
            dest: '<%= fhpkg.name %>-<%= fhbuildver %>-<%= fhos %>.' + process.arch
          }
        ]
      }
    }
  });

  grunt.config.merge({
    fh: {
      'no-target-specified': {}, // this one should remain on top
      dist: {},
      test: {},
      unit: {},
      clean: {},
      accept: {},
      default: {},
      coverage: {},
      testfile: {},
      integrate: {},
      'make-version-file': {}
    }
  });

  grunt.config.merge({
    'fhpkg': grunt.file.readJSON('package.json')
  });

  grunt.config.merge({
    'fhbuildnum': '<%= process.env["BUILD_NUMBER"] || "DEV-VERSION" %>'
  });

  grunt.config.merge({
    'fhbuildver': '<%= fhpkg.version.replace("BUILD-NUMBER", fhbuildnum) %>'
  });

  grunt.config.merge({
    shell: {
      options: {
        stdout: true,
        stderr: true,
        failOnError: true,
        execOptions: {
          // This buffer isn't large enough by default and things fail
          maxBuffer: 1024 * 1024 * 64
        }
      },

      'get-rpm-dist-tag': {
        command: 'rpm --eval=%dist',
        options: {
          callback: function(err, stdout, stderr, cb) {
            if (err || stdout[0] === '%' || stderr !== '') {
              grunt.task.run('shell:fallback-to-non-rpm-based-distro');
              return cb();
            }
            grunt.config.set('fhos', stdout.slice(1).trim());
            return cb();
          }
        }
      },

      'fallback-to-non-rpm-based-distro': {
        command: 'python -c "import platform; print platform.linux_distribution()"',
        options: {
          callback: function(err, stdout, stderr, cb) {
            if (err) {
              throw err;
            }

            var dvi = stdout.toLowerCase().split("'").filter(function(v) {
              return v !== '(' && v !== ', ' && v !== ')';
            });

            grunt.config.set('fhos', dvi[0].trim());
            return cb();
          }
        }
      },

      'fh-run-array': {
        command: function(test_type) {
          var cmd = '';

          if (test_type && grunt.config.get(test_type)) {
            var cmds = grunt.config.get(test_type);
            cmd = typeof cmds === 'string' ? cmds : cmds.join(' && ');
          } else {
            grunt.log.warn("Skipping", grunt.task.current.nameArgs,
                           "-- invalid or missing parameter");
          }

          return cmd;
        }
      },

      'fh-report-cov': {
        command: function() {
          var cmd = './node_modules/.bin/istanbul report';

          var argsArray = Array.prototype.slice.call(arguments);
          argsArray.forEach(function(arg) {
            cmd += ' ' + arg;
          });

          return cmd;
        }
      }
    }
  });


  var checkPlaceholderFileExists = function() {
    try {
      require(path.resolve('config/ose-placeholders.js'));
      return true;
    } catch (exception) {
      grunt.log.debug('No placeholder file found for openshift 3 - continuing normally');
      return false;
    }
  };

  var runTestsForSingleFile = function(args) {
    var testFile = args[0];
    if (!testFile) {
      grunt.log.errorlns("Please specify test file to run: grunt fh:testfile:filename.js");
      return;
    }
    // Task name (grunt file config variable)
    var testType = "unit_single";
    // Task filename parameter (used as template in runtime script)
    grunt.config.set("unit_test_filename", testFile);
    for (var index = 1; index < args.length; index++) {
      grunt.config.set("unit_test_param" + index, args[index]);
    }
    var cmdArray = grunt.config.get(testType);
    if (!cmdArray) {
      grunt.log.errorlns("No local config for single tests. Please define " + testType + " property in config.");
      return;
    }
    grunt.task.run(['shell:fh-run-array:' + testType]);
  };

  grunt.registerTask('fh-generate-dockerised-config','Task to generate openshift config file', function() {
    var conf = require(path.resolve('config/dev.json'));
    var placeholders = require(path.resolve('config/ose-placeholders.js'));

    grunt.log.debug('Generating openshift 3 config file');
    _.forOwn(placeholders, function(value, key) {
      grunt.log.debug('key', key, 'value', value);
      _.set(conf, key, value);
    });
    fs.writeFileSync('conf-docker.json', JSON.stringify(conf, true, 2));
    grunt.log.debug('Created file conf-docker.json');

  });



  grunt.registerMultiTask('fh', function() {

    if (this.target === 'no-target-specified') {
      grunt.fail.warn('A target must be provided to `grunt fh`');
    }

    grunt.task.run('env:fh');

    if (this.target === 'dist') {
      grunt.task.run(['clean:fh-dist', 'fh:make-version-file', 'copy:fh-dist']);

      if (checkPlaceholderFileExists()) {
        grunt.task.run('fh-generate-dockerised-config');
      }

      if (!grunt.option('only-bundle-deps')) {
        grunt.task.run('compress:fh-dist');
      }
      if (!grunt.option('no-bundle-deps')) {
        if (process.platform === 'linux') {
          grunt.task.run('shell:get-rpm-dist-tag');
        } else {
          grunt.config.set('fhos', process.platform);
        }
        grunt.task.run('compress:fh-dist-deps');
      }
    } else if (this.target === 'make-version-file') {
      grunt.file.write('output/' + grunt.config('fhbuildver') + '/VERSION.txt',
                       grunt.config('fhbuildver') + '\n');
    } else if (this.target === 'clean') {
      grunt.task.run(['clean:fh-main', 'clean:fh-dist', 'clean:fh-cov']);
    } else if (this.target === 'test') {
      grunt.task.run(['shell:fh-run-array:unit', 'shell:fh-run-array:integrate',
                      'shell:fh-run-array:accept']);
    } else if (this.target === 'unit') {
      grunt.task.run(['shell:fh-run-array:unit']);
    } else if (this.target === 'testfile') {
      runTestsForSingleFile(arguments);
    } else if (this.target === 'integrate') {
      grunt.task.run(['shell:fh-run-array:integrate']);
    } else if (this.target === 'accept') {
      grunt.task.run(['shell:fh-run-array:accept']);
    } else if (this.target === 'coverage') {
      grunt.task.run([
        'clean:fh-cov', 'shell:fh-run-array:unit_cover',
        'shell:fh-run-array:integrate_cover', 'shell:fh-run-array:accept_cover',
        'shell:fh-report-cov:lcov', 'shell:fh-report-cov:cobertura'
      ]);
    } else if (this.target === 'default') {
      grunt.task.run(['eslint', 'fh:test', 'fh:dist']);
    } else {
      grunt.fail.warn('Unknown target provided to `grunt fh`');
    }
  });

  grunt.registerTask('fh-dist',
                     'Create two tarballs in ./dist/: with and without node_modules directory',
                     ['fh:dist']);
  grunt.registerTask('fh-clean',
                     'Clean up files generated by grunt-fh-build',
                     ['fh:clean']);
  grunt.registerTask('fh-unit',
                     'Run array of commands defined as "unit" in Gruntfile.js',
                     ['fh:unit']);
  grunt.registerTask('fh-integrate',
                     'Run array of commands defined as "integrate" in Gruntfile.js',
                     ['fh:integrate']);
  grunt.registerTask('fh-accept',
                     'Run array of commands defined as "accept" in Gruntfile.js',
                     ['fh:accept']);
  grunt.registerTask('fh-test',
                     'Run all configured unit, integration, and acceptance tests',
                     ['fh:test']);
  grunt.registerTask('fh-coverage',
                     'Run all configured tests and compute code coverage',
                     ['fh:coverage']);
  grunt.registerTask('fh-default',
                     'The default set of tasks that should be run during CI builds. ' +
                     'Currently runs: eslint, fh-test, and fh-dist',
                     ['fh:default']);

};
