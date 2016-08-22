package generators

import (
	"flag"
	"os"
	"path/filepath"
	"strings"

	"github.com/goadesign/goa/design"
	"github.com/goadesign/goa/goagen/codegen"
	"text/template"
	"strconv"
)

type ConfigGenerator struct {
	OutDir string
	Api    *design.APIDefinition
	Port int
}

func ConfigGenerate() ([]string, error) {
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

	g := &ConfigGenerator{OutDir: outDir, Api: design.Design}

	return g.Generate()

}

func (cg *ConfigGenerator) Generate() ([]string, error) {

	confFile := filepath.Join(cg.OutDir, "config", "dev.json")
	confVal := filepath.Join(cg.OutDir, "config", "configValidation.js")
	port := cg.Api.Host[strings.LastIndex(cg.Api.Host, ":")+1:]
	pInt,err := strconv.ParseInt(port,10,32)
	if err != nil {
		return nil, err
	}
	cg.Port = int(pInt)


	confT := template.New("conf")
	confT , err = confT.Funcs(CommonTemplateFuncs).Parse(confFileTemplate)
	if err != nil{
		return nil,err
	}
	confV := template.New("confValidate")
	confV, err  = confV.Parse(confValidateTemplate)
	if err != nil{
		return nil,err
	}


	if err := CreateDirIfNotExists(cg.OutDir + "/config"); err != nil {
		return nil, err
	}
	if err := CreateFileIfNotExists(confFile); err != nil {
		return nil, err
	}

	if err := CreateFileIfNotExists(confVal); err != nil {
		return nil, err
	}


	f, err := os.OpenFile(confFile,os.O_WRONLY|os.O_TRUNC,0766)
	if err != nil{
		return nil,err
	}
	defer f.Close()
	if err := confT.Execute(f,cg); err != nil{
		return nil,err
	}
	cf, err := os.OpenFile(confVal,os.O_WRONLY|os.O_TRUNC,0766)
	if err != nil{
		return nil,err
	}
	defer cf.Close()

	if err := confV.Execute(cf,nil); err != nil{
		return nil,err
	}

	return []string{confFile, confVal}, nil

}

var confFileTemplate = `{
	"port":{{.Port}},
	"logger": {
    	"name": "{{.Api.Name}}",
    	"streams": [{
      	"type": "stream",
      	"src": true,
      	"level": "trace",
      	"stream": "process.stdout"
    }, {
      "type": "raw",
      "src": true,
      "level": "trace",
      "stream": "ringBuffer"
    }]
  }
}`

var confValidateTemplate = `module.exports = []`
