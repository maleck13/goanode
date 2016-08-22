package goanode

import (
	"flag"
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"

	"github.com/goadesign/goa/design"
	"github.com/goadesign/goa/goagen/codegen"
	"github.com/goadesign/goa/goagen/gen_client"
	"github.com/goadesign/goa/goagen/gen_swagger"
	"github.com/maleck13/goanode/generators"
)

func Generate() ([]string, error) {
	var (
		ver    string
		outDir string
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

	files := make([]string, 0)

	sFiles, err := genswagger.Generate()
	if err != nil {
		return nil, err
	}
	files = append(files, sFiles...)

	sFiles, err = genclient.Generate()
	if err != nil {
		return nil, err
	}
	files = append(files, sFiles...)

	sFiles, err = generators.PackageJsonGenerate()
	if err != nil {
		return nil, err
	}
	files = append(files, sFiles...)

	sFiles, err = generators.HandlerGenerate()
	if err != nil {
		return nil, err
	}
	files = append(files, sFiles...)

	sFiles, err = generators.RouterGenerate()
	if err != nil {
		return nil, err
	}

	files = append(files, sFiles...)

	sFiles, err = generators.ModelGenerate()
	if err != nil {
		return nil, err
	}

	files = append(files, sFiles...)

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

// WriteNames creates the names.txt file.
func WriteNames(api *design.APIDefinition, outDir string) ([]string, error) {
	// Now iterate through the resources to gather their names
	names := make([]string, len(api.Resources))
	i := 0
	api.IterateResources(func(res *design.ResourceDefinition) error {
		if n, ok := res.Metadata["pseudo"]; ok {
			names[i] = n[0]
		} else {
			names[i] = res.Name
		}
		i++
		return nil
	})

	content := strings.Join(names, "\n")
	// Write the output file and return its name
	outputFile := filepath.Join(outDir, "names.txt")
	if err := ioutil.WriteFile(outputFile, []byte(content), 0755); err != nil {
		return nil, err
	}
	return []string{outputFile}, nil
}
