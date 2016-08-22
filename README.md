## Generating the app


```
goagen gen -d github.com/maleck13/goanode/example/design --pkg-path=github.com/maleck13/goanode -o=app

```

## Issues

 - Currently the dependencies in the package.json are hard coded. This makes it simple but not very useful to a wider audience
 - Cannot deal with deep user type defs yet
 - Not dealing with all the DSL just focused on the main bits for getting example working
