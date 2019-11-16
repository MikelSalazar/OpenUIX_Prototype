/** Defines a data File */
class File {

	/** Initializes a new File Instance.
	 * @param name The name of the File.
	 * @param {*} params The creation parameters of the File. */
	constructor(name, params) {

		// Check the given name
		if (!name) throw new Error ("Invalid File name");
			
		// Define the fields
		this.name = name;
		this.isFile = true;
		this.loaded = false;
		this.path = params.path || null;
		this.format = params.format || 'json';
		this.onload = params.onload || null;
		this.data = params.data || null;

		// If there is a path, load it
		if (this.path) this.load();

		// Add this instance to the global list
		if (!File.Instances[name]) File.Instances[this.name] = this;
		else throw new Error ("Repeated File name: " + name);
	}


	/** Loads the File. */
	load() {

		// Show a message on console
		console.log("Loading File: " + this.path);

		// Create an XMLHttpRequest
		let xhr = new XMLHttpRequest();
		xhr.open('GET', this.path);
		xhr.responseType = this.format;
		xhr.sender = this;

		// Define what to do when the File is loaded
		xhr.onload = function(e) {
			
			// Save the data of the File
			this.sender.data = xhr.response;

			// Call the associated function
			if (this.sender.onload) this.sender.onload(this.sender);
			
			// Mark the File as (completely) loaded
			this.loaded = true;

			// Show a message on console
			console.log("Loaded File: " + this.sender.path);
		}

		// Define what to do when the File is loaded
		xhr.onerror = function(e) { 
			throw new Error("Unable to load File: " + this.sender.path);
		};

		// Send the XMLHttpRequest
		xhr.send();

	}
}


// The global list of Files
File.Instances = {};