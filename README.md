## Note this is a POC and not a full implementation. It is not ready for general use

## Generating the app

install golang folling the instructions at golang.org

```
go get github.com/goadesign/goa
go get github.com/goadesign/goa/goagen
go get github.com/maleck13/goanode

create a design or to try it out copy the design in  $GOPATH/src/github.com/maleck13/goanode/example/design/design.go


mkdir -p $GOPATH/src/github.com/fheng/myapp/design
cd $GOPATH/src/github.com/fheng/myapp
cp $GOPATH/src/github.com/maleck13/goanode/example/design/design.go ./design/design.go
goagen gen -d github.com/fheng/myapp/design --pkg-path=github.com/maleck13/goanode -o=app
cd app
npm install .
node main.js ./config/dev.json

##make the cli
cd myapp/tool/cellar_cli
go build .
./cellar_cli bottle show --bottleID=10


## try from swagger http://editor.swagger.io/

copy the contents of myapp/swagger/swagger.yaml into the swagger editor and start your app. Should be good to try the api

```

## Issues

 - Currently the dependencies in the package.json are hard coded. This makes it simple but not very useful to a wider audience
 - Cannot deal with deep user type defs yet
 - Not dealing with all the DSL just focused on the main bits for getting example working
