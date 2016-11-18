package generators

import (
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"text/template"

	"github.com/goadesign/goa/design"
	"github.com/goadesign/goa/goagen/codegen"
)

type HandlerGenerator struct {
	OutDir string
	Api    *design.APIDefinition
}

func HandlerGenerate() ([]string, error) {
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

	g := &HandlerGenerator{OutDir: outDir, Api: design.Design}

	return g.Generate()
}

func (hg *HandlerGenerator) Generate() ([]string, error) {
	hg.Api.IterateResources(func(r *design.ResourceDefinition) error {
		outFile := filepath.Join(hg.OutDir, r.Name+".js")
		if err := CreateFileIfNotExists(outFile); err != nil {
			fmt.Println(err)
			return err
		}
		t := template.New("handler").Funcs(template.FuncMap{
			"isEnd": func(n, total int) bool {
				return n == total-1
			},
		})
		t, err := t.Parse(handlerTemplate)
		if err != nil {
			fmt.Println(err)
			return err
		}
		f, err := os.OpenFile(outFile, os.O_WRONLY, 0666)
		if err != nil {
			fmt.Println(err)
			return err
		}

		if err := t.Execute(f, r); err != nil {
			return err
		}

		return nil
	})
	return nil, nil
}

var handlerTemplate = `
	 module.exports = function {{.Name}}(){
	   return{
	   {{range $key,$val :=  .Actions}}
	     "{{.Name}}" : ()=>{
		     return function {{.Name}}Handler (req,res){
		       //your business logic here
		       res.json({});
		     };
		 },
		{{end}}
		};
	 }

`
