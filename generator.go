package goanode

import (
	"flag"
	"os"

	"github.com/goadesign/goa/design"
	"github.com/goadesign/goa/goagen/codegen"
	"github.com/goadesign/goa/goagen/gen_client"
	"github.com/goadesign/goa/goagen/gen_swagger"
	"github.com/maleck13/goanode/generators"
)

//Generate is the entry point for the goagen tool
func Generate() ([]string, error) {
	var (
		ver    string
		outDir string
		files  []string
		_      = design.Design
	)
	set := flag.NewFlagSet("app", flag.PanicOnError)
	set.String("design", "", "") // Consume design argument so Parse doesn't complain
	set.StringVar(&ver, "version", "", "")
	set.StringVar(&outDir, "out", "", "")
	set.Parse(os.Args[2:])

	// First check compatibility
	if err := codegen.CheckVersion(ver); err != nil {
		return nil, err
	}
	//generate swagger doc
	sFiles, err := genswagger.Generate()
	if err != nil {
		return nil, err
	}
	files = append(files, sFiles...)

	//generate cli client
	sFiles, err = genclient.Generate()
	if err != nil {
		return nil, err
	}
	files = append(files, sFiles...)
	// generate package.json
	sFiles, err = generators.PackageJsonGenerate()
	if err != nil {
		return nil, err
	}
	files = append(files, sFiles...)
	//generate handlers
	sFiles, err = generators.HandlerGenerate()
	if err != nil {
		return nil, err
	}
	files = append(files, sFiles...)
	//generate router
	sFiles, err = generators.RouterGenerate()
	if err != nil {
		return nil, err
	}
	files = append(files, sFiles...)
	//generate models
	sFiles, err = generators.ModelGenerate()
	if err != nil {
		return nil, err
	}
	files = append(files, sFiles...)
	//generate main.js
	sFiles, err = generators.ServerGenerate()
	if err != nil {
		return nil, err
	}
	files = append(files, sFiles...)

	sFiles, err = generators.ConfigGenerate()
	if err != nil {
		return nil, err
	}
	files = append(files, sFiles...)

	return files, nil
}
