package generators

import (
	"flag"
	"os"
	"path/filepath"
	"text/template"

	"github.com/goadesign/goa/design"
	"github.com/goadesign/goa/goagen/codegen"
)

type PackageJsonGenerator struct {
	OutDir  string
	OutFile string
	Api     *design.APIDefinition
}

func PackageJsonGenerate() ([]string, error) {
	var (
		outDir  string
		ver     string
		outFile string
	)
	set := flag.NewFlagSet("app", flag.PanicOnError)
	set.String("design", "", "")
	set.StringVar(&outDir, "out", "", "")
	set.StringVar(&ver, "version", "", "")
	set.Parse(os.Args[1:])
	outFile = filepath.Join(outDir, "package.json")
	if err := codegen.CheckVersion(ver); err != nil {
		return nil, err
	}

	g := &PackageJsonGenerator{OutDir: outDir, OutFile: outFile, Api: design.Design}

	return g.Generate()
}

func (pw *PackageJsonGenerator) Generate() ([]string, error) {
	t := template.New("packageJson")
	t, err := t.Parse(packageJsonTemplate)
	if err != nil {
		return nil, err
	}
	if err := CreateDirIfNotExists(pw.OutDir); err != nil {
		return nil, err
	}
	if err := CreateFileIfNotExists(pw.OutFile); err != nil {
		return nil, err
	}
	f, err := os.OpenFile(pw.OutFile, os.O_WRONLY, 0666)
	if err != nil {
		return nil, err
	}
	if err := t.Execute(f, pw.Api); err != nil {
		return nil, err
	}
	return []string{pw.OutFile}, nil
}

const packageJsonTemplate = `{
 "name": "{{.Name}}",
  "version": "1.0.0",
  "description": "{{.Description}}",
  "main": "main.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "",
  "license": "ISC",
  "dependencies": {
    "async": "2.0.1",
    "body-parser": "1.4.3",
    "cors": "2.7.1",
    "express": "4.14.0",
    "express-bunyan-logger": "1.2.0",
    "express-jsonschema": "^1.1.0",
    "fh-cluster": "0.3.0",
    "fh-config": "1.0.0",
    "fh-health": "0.2.0",
    "fh-logger": "0.5.1",
    "lodash": "4.15.0",
    "optimist": "0.6.1"
  },
  "devDependencies": {
    "mocha": "^2.3.4",
    "proxyquire": "0.5.3",
    "supertest": "0.8.2",
    "grunt-fh-build": "1.0.2"
  }
}`
