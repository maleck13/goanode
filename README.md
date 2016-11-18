## Note this is a POC and not a full implementation. It is not ready for general use

This project builds ontop of the [goa DSL](http://goa.design) to produce a basic nodejs micro service. It generates the following:
- swagger docs
- a cli tool with commands for your api
- a js client for use with your client code 
- a go client for use with your go code 
- a package.json
- a router
- handlers
- models
- a main.js

## Setup Environment

install Go folling the instructions at golang.org. Ensure to setup your $GOPATH  [docs](https://golang.org/doc/install#testing)
If you want your $GOPATH to be $HOME/work. Create dir called src there. and then export ```export $GOPATH=$HOME/work```


```
go get github.com/goadesign/goa
go get github.com/goadesign/goa/goagen
mkdir -p $GOPATH/src/github.com/maleck13
go get github.com/maleck13/goanode
cd $GOPATH/src/github.com/goadesign/goa
git checkout v1.0.0
cd $GOPATH/src/github.com/goadesign/goa/goagen
go install // puts it on your path ready for use anywhere 
```

## Generating a microservice bases on a api design
The below assumes your $GOPATH is set to $HOME/work . But this should work with any $GOPATH 

create a design or to try it out by copying the design in  $GOPATH/src/github.com/maleck13/goanode/example/design/design.go


```
mkdir -p $GOPATH/src/myapp/design 
cd $GOPATH/src/myapp
cp $GOPATH/src/github.com/maleck13/goanode/example/design/design.go ./design/design.go
goagen gen -d myapp/design --pkg-path=github.com/maleck13/goanode -o=app
cd app
npm install .
node main.js ./config/dev.json

```

The flags are as follows:

``` -d ``` is the  directory where the design file is 

``` --pkg-path``` is where the goanode generator lives 

``` -o ``` is the output directory or where the code will be generated.  

##make the js client 

```
 cd $GOPATH/src/myapp/app 
 goagen js -d myapp/design  
```


##make the cli
```
cd $GOPATH/src/myapp/app/tool/cellar_cli
go build .
./cellar_cli show bottle --bottleID=10
```

## try from swagger http://editor.swagger.io/

copy the contents of myapp/swagger/swagger.yaml into the swagger editor and start your app. Should be good to try the api

```

## Issues

 - Currently the dependencies in the package.json are hard coded. This makes it simple but not very useful to a wider audience
 - Cannot deal with deep user type defs yet
 - Not dealing with all the DSL just focused on the main bits for getting example working
 - vendoring goa seems to cause issues with generation (not sure what the issue is yet)
