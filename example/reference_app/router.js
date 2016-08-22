var validate = require('express-jsonschema').validate;
var bottleModel = require('./model/bottle').BottleSchema;
var bottleController = require('./bottle');

module.exports = function router(expressApp){
	expressApp.post("/bottle",validate({body: bottleModel}),bottleController.create());
};