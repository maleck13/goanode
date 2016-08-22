package design

import (
	. "github.com/goadesign/goa/design" // Use . imports to enable the DSL
	. "github.com/goadesign/goa/design/apidsl"
)

var _ = API("cellar", func() { // API defines the microservice endpoint and
	Title("The virtual wine cellar")    // other global properties. There should be one
	Description("A simple goa service") // and exactly one API definition appearing in
	Scheme("http")                      // the design.
	Origin("*", func() {
		Methods("GET", "POST", "DELETE", "PUT")
	})
	Host("localhost:3200")
	Produces("application/json")
})

var _ = Resource("bottle", func() { // Resources group related API endpoints
	BasePath("/bottles")      // together. They map to REST resources for REST
	DefaultMedia(BottleMedia) // services.

	Action("show", func() { // Actions define a single API endpoint together
		Description("Get bottle by id") // with its path, parameters (both path
		Routing(GET("/:bottleID"))      // parameters and querystring values) and payload
		Params(func() {                 // (shape of the request body).
			Param("bottleID", Integer, "Bottle ID")
		})
		Response(OK, func() {
			Media(BottleMedia)
		}) // Responses define the shape and status code
		Response(NotFound) // of HTTP responses.
	})
	Action("create", func() { // Actions define a single API endpoint together
		Description("create a bottle") // with its path, parameters (both path
		Routing(POST("/"))             // parameters and querystring values) and payload
		Payload(Bottle)
		Response(Created)    // Responses define the shape and status code
		Response(BadRequest) // of HTTP responses.
	})
	Action("delete", func() { // Actions define a single API endpoint together
		Description("delete a bottle") // with its path, parameters (both path
		Routing(DELETE("/:bottleID"))  // parameters and querystring values) and payload
		Params(func() {
			Param("bottleID", Integer, "Bottle ID")
		})
		Response(NoContent)  // Responses define the shape and status code
		Response(BadRequest) // of HTTP responses.
		Response(NotFound)
	})
	Action("update", func() { // Actions define a single API endpoint together
		Description("update a bottle") // with its path, parameters (both path
		Routing(POST("/:bottleID"))    // parameters and querystring values) and payload
		Payload(Bottle2)
		Response(OK)         // Responses define the shape and status code
		Response(BadRequest) // of HTTP responses.
	})
	Action("list", func() { // Actions define a single API endpoint together
		Description("list bottle") // with its path, parameters (both path
		Routing(GET("/"))          // parameters and querystring values) and payload
		Response(OK, func() {
			Media(CollectionOf(BottleMedia))
		}) // Responses define the shape and status code
		Response(InternalServerError) // of HTTP responses.
	})
})

// BottleMedia defines the media type used to render bottles.
var BottleMedia = MediaType("application/vnd.goa.example.bottle+json", func() {
	Description("A bottle of wine")
	Attributes(func() { // Attributes define the media type shape.
		Attribute("id", String, "Unique bottle ID")
		Attribute("href", String, "API href for making requests on the bottle")
		Attribute("name", String, "Name of wine")
		Required("id", "href", "name")
	})
	View("default", func() { // View defines a rendering of the media type.
		Attribute("id", String)   // Media types may have multiple views and must
		Attribute("href", String) // have a "default" view.
		Attribute("name", String)
	})
})

var Bottle = Type("CreateBottle", func() {
	Attribute("href", String)
	Attribute("name", String)
	Required("href", "name")
})

var Bottle2 = Type("UpdateBottle", func() {
	Attribute("id", String)
	Attribute("href", String)
	Attribute("name", String)
	Required("id")
})
