module.exports = function errorHandler(err,req,res,	next){
	var responseData;
    if (err.name === 'JsonSchemaValidation') {
 
        // Log the error however you please 
        console.log(err.message);
        // logs "express-jsonschema: Invalid data found" 
 
        // Set a bad request http response status 
        res.status(400);
 
        // Format the response body 
        responseData = {
           statusText: 'Bad Request',
           jsonSchemaValidation: true,
           validations: err.validations  // All of your validation information 
        };
 
       res.json(responseData);
 
    } else {
        // pass error to next error middleware handler 
        next(err);
    }
};