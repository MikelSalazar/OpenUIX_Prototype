/** Defines a Data Source. */
class Source {

	/** Initializes a new Source Instance.
	 * @param name The name of the Source.
	 * @param {*} params The creation parameters of the Source. */
	constructor(name, params = {}) {

		// Check the name
		this.name = name || "Source";

		// Check the values
		this.value = 0; 
		this.values = []; 
		if (params.values) params.values.forEach(v => { this.values.push(v); })

		// Create the fields of the Source
		this.updated = false;
		this.isSource = true;

		// Create an event
		this.linkedParameters = [];

		// Adds the generator to the global list
		Source.instances.push(this);
	}

	/** Updates the Source data. */
	update () {
		
		this.linkedParameters.forEach(parameter => {
			parameter.set(this.value)
			// console.log("Updating " + parameter.name);
		});
			
		this.updated = true;
	}
}

// The global list of Data Sources
Source.instances = []