exports.BottleSchema = {
    type: 'object',
    properties: {
        name: {
            type: 'string',
            required: true
        },
        href:{
        	type: 'string',
        	required: true
        },
        id:{
        	type:'string',
        	required:false
        }
    }
}

//need to figure out how to build deep json objects https://spacetelescope.github.io/understanding-json-schema/structuring.html