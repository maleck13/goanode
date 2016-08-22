## Generating the app


```
go get github.com/goadesign/goa
go get github.com/goadesign/goa/goagen

create a design or to try it out copy the design in  github.com/maleck13/goanode/example/design/design.go


mkdir myapp
cd myapp
goagen gen -d <path to design.go> --pkg-path=github.com/maleck13/goanode -o=app
cd app
npm install .
node main.js ./config/dev.json

##make the cli
cd myapp/tool/cellar_cli
go build .
./cellar_cli bottle show --bottleID=10

```

## Issues

 - Currently the dependencies in the package.json are hard coded. This makes it simple but not very useful to a wider audience
 - Cannot deal with deep user type defs yet
 - Not dealing with all the DSL just focused on the main bits for getting example working
