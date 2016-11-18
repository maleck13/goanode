package generators

import (
	"flag"
	"fmt"
	"os"
	"text/template"

	"github.com/goadesign/goa/design"
	"github.com/goadesign/goa/goagen/codegen"
)

type RouterGenerator struct {
	OutDir string
	Api    *design.APIDefinition
}

func RouterGenerate() ([]string, error) {
	var (
		outDir string
		ver    string
	)
	set := flag.NewFlagSet("app", flag.PanicOnError)
	set.String("design", "", "")
	set.StringVar(&outDir, "out", "", "")
	set.StringVar(&ver, "version", "", "")
	set.Parse(os.Args[1:])
	if err := codegen.CheckVersion(ver); err != nil {
		return nil, err
	}

	g := &RouterGenerator{OutDir: outDir, Api: design.Design}

	return g.Generate()
}

func (rg *RouterGenerator) Generate() ([]string, error) {
	//need to check the media or payload. then require the generated json schema
	t := template.New("router").Funcs(CommonTemplateFuncs)
	t, err := t.Parse(routerTemplate)
	if err != nil {
		fmt.Println("error parsing", err)
		return nil, err
	}
	outFile := rg.OutDir + "/router.js"
	if err := CreateFileIfNotExists(outFile); err != nil {
		return nil, err
	}
	f, err := os.OpenFile(outFile, os.O_WRONLY|os.O_TRUNC, 0666)
	if err != nil {
		fmt.Println(err)
		return nil, err
	}
	defer f.Close()
	// fmt.Println("executing template", r.Actions)
	if err := t.Execute(f, rg.Api.Resources); err != nil {
		return nil, err
	}
	return nil, nil
}

var routerTemplate = `
	var validate = require('express-jsonschema').validate;
	{{range $key,$val := .}}var {{$key}}Handler = require('./{{$key}}');
	{{range $val.Actions}}{{if .Payload }}var {{.Payload.TypeName}} = require('./model/{{$key}}').{{gotypename .Payload nil 0 true}};
	{{end}}{{end}}{{end}}
	module.exports = function router(expressApp){
		{{range $key,$val := .}}
		const {{$key}}RequestHandler = {{$key}}Handler()
		{{range $aKey, $aVal := $val.Actions}}
		{{range .Routes }}{{if $aVal.Payload }}expressApp.{{toLower .Verb}}("{{.FullPath}}",validate({body: {{$aVal.Payload.TypeName}}}),{{$key}}RequestHandler.{{$aVal.Name}}());
		{{else}}expressApp.{{toLower .Verb}}("{{.FullPath}}",{{$key}}RequestHandler.{{$aVal.Name}}());
		{{end}}{{end}}{{end}}
	{{end}}
	};
`
