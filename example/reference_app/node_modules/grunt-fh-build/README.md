# grunt-fh-build

> A plugin for development and build lifecycle of FeedHenry components

## Getting Started
This plugin requires Grunt `~0.4.5`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out
the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains
how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as
install and use Grunt plugins.
Once you're familiar with that process, you may install this plugin with this
command:

```shell
npm install grunt-fh-build --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile
with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-fh-build');
```

## The "fh" task

### Overview
The task exposed by this plugin is called `fh`, and is used as more of a
namespace prefix for the targets that provide its functionality.
You probably won't want to call `grunt fh` by itself, but rather one of its
targets.
In most cases, these targets will wrap other plugins and provide default
configuration values.

### Targets

#### fh:dist
This target creates the tarball for the project in which grunt is run. The
archive will be named according to the following:

    <name>-<version>-<build-number>.tar.gz

In the above, `name` and `version` come from the `package.json` file, and
`build-number` is one of the following:

  * Value of `BUILD_NUMBER` env variable (as set by Jenkins, for example), or
  * the literal string `DEV-VERSION`, if no `BUILD_NUMBER` variable is set.

### fh:clean
This target removes generated files & directories that may be created by other
targets, including the `node_modules` directory created by `npm`.

### fh:test
This target will run *all* tests; starting with unit tests, then integration
tests, and finally acceptance tests. See below sections `fh:unit`,
`fh:integrate` and `fh:accept` for more information on how to configure these.

### fh:unit
This target will run the unit tests for the project. To configure which and how
tests are run, add a property called `unit` to the configuration in your
Gruntfile.js. This property is an array of commands to run, so that different
test runners can be used per project:

    unit: ['mocha -A -u exports --recursive -t 10000 ./test/helper.js ./test/unit']

Note: by default, the directory `node_modules/.bin` will be added to the
beginning of the `PATH` environment variable, so we don't have to specify the
path to commands, if they reside in that directory.

### fh:testfile
This target will run the single unit test file for the project. To configure which and how
tests are run, add a property called `unit_single` to the configuration in your
Gruntfile.js. Command string should contain `test_filename` placeholder 
that will be replaced with filename argument at runtime. Additional parameters are supported by specifying
`unit_test_param1` where 1 is number of parameter after filename.
This property is an array of commands to run, so that different test runners can be used per project.
Example for mocha framework with support for running single test method.

    unit_single: ['mocha -A -u exports ./test/helper.js ./test/unit/**/<%= unit_test_filename %> --grep=<%= unit_test_param1 %>''],
    
Example:

    grunt fh:testfile:testfile.js

### fh:integrate
This target works the same as the `fh:unit` one above, with the exception that
the property specifying the commands to run will be called `integrate`.

### fh:accept
This target works the same as the `fh:unit` one above, with the exception that
the property specifying the commands to run will be called `accept`.

### fh:coverage
This target will compute the code coverage provided by unit and acceptance
tests, and produce reports (both lcov and cobertura reports).

Like the unit/integrate/accept test targets, array properties specifying the
commands to compute the coverage for each type of test, need to be included in
your project's `Gruntfile.js`, just suffixed with `_cover`:

    unit_cover: ['istanbul cover --dir cov-unit turbo --series=true -- ./test/unit'],
    accept_cover: ['istanbul cover --dir cov-accept turbo --series=true -- --setUp ./test/globalSetupTeardown.js --tearDown ./test/globalSetupTeardown.js ./test/accept']

### fh:analysis
This target will generate an HTML static analysis report using plato.

### fh:shrinkwrap
This target is just a wrapper around `npm cache clean && npm shrinkwrap`. Its
purpose is to reduce the amount of diff churn (esp. in the 'from' and 'resolved'
fields after running `npm shrinkwrap`.

See https://www.npmjs.com/package/npm-shrinkwrap#reduce-diff-churn for details.
