package goanode

import (
	"flag"
	"github.com/goadesign/goa/design"
	"github.com/goadesign/goa/goagen/codegen"
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"
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

	return WriteNames(design.Design, outDir)
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
