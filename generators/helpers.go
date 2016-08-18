
package generators

import (
	"os"
)

func CreateFileIfNotExists(file string) error {
	_, err := os.Stat(file)
	if os.IsNotExist(err){
		f,err := os.Create(file)
		if err != nil{
			return err
		}
		defer f.Close()
		return nil
	}
	return err

}

func CreateDirIfNotExists(path string)error  {
	_, err := os.Stat(path)
	if os.IsNotExist(err){
		if err := os.MkdirAll(path,0666); err != nil{
			return err
		}
		return nil
	}
	return err
}
