package generators

import (
	"os"
	"strings"
	"text/template"

	"github.com/goadesign/goa/goagen/codegen"
)

func CreateFileIfNotExists(file string) error {
	_, err := os.Stat(file)
	if os.IsNotExist(err) {
		f, err := os.Create(file)
		if err != nil {
			return err
		}
		defer f.Close()
		return nil
	}
	return err

}

func CreateDirIfNotExists(path string) error {
	_, err := os.Stat(path)
	if os.IsNotExist(err) {
		if err := os.MkdirAll(path, 0766); err != nil {
			return err
		}
		return nil
	}
	return err
}

var CommonTemplateFuncs = template.FuncMap{
	"gotyperef":  codegen.GoTypeRef,
	"gotypedef":  codegen.GoTypeDef,
	"gotypename": codegen.GoTypeName,
	"toLower":    strings.ToLower,
	"toUpper":    strings.ToUpper,
}
