package generators

import (
	"flag"
	"fmt"
	"os"
	"strings"
	"text/template"

	"github.com/goadesign/goa/design"
	"github.com/goadesign/goa/goagen/codegen"
)

type ModelGenerator struct {
	OutDir string
	Api    *design.APIDefinition
}

func ModelGenerate() ([]string, error) {
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

	g := &ModelGenerator{OutDir: outDir, Api: design.Design}

	return g.Generate()
}

func (mg *ModelGenerator) Generate() ([]string, error) {
	if err := CreateDirIfNotExists(mg.OutDir + "/model"); err != nil {
		return nil, err
	}
	var files []string
	err := mg.Api.IterateResources(func(r *design.ResourceDefinition) error {
		fileName := mg.OutDir + "/model/" + strings.ToLower(r.Name) + ".js"
		files = append(files, fileName)
		if err := CreateFileIfNotExists(fileName); err != nil {
			return err
		}
		f, err := os.OpenFile(fileName, os.O_WRONLY|os.O_TRUNC, 0666)
		if err != nil {
			fmt.Println(err)
			return err
		}
		defer f.Close()
		// fmt.Println("executing template", r.Actions)
		t := template.New("models").Funcs(CommonTemplateFuncs)
		t, err = t.Parse(modelTemplate)
		if err != nil {
			fmt.Println("error parsing", err)
			return err
		}
		err = mg.Api.IterateUserTypes(func(ut *design.UserTypeDefinition) error {

			if err := t.Execute(f, ut); err != nil {
				return err
			}
			return nil
		})
		if err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	return files, nil
}

var modelTemplate = `//generated file do not manually edit 
exports.{{gotypename . nil 0 true}} = {
	{{$type := .AttributeDefinition.Type}}{{if $type.IsObject}}
    type: 'object',
    properties: { {{$ob := $type.ToObject}} {{range $k, $v := $ob}}
        {{$k}}: {
            type: '{{$v.Type.Name}}',{{if $.IsRequired $k}}
            required: true{{else}}
            required: false {{end}}
        }, {{end}}
    }
    {{end}}
}
`
