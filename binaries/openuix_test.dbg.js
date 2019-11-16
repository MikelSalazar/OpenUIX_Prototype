/* A prototype created to explain the vision of the OpenUIX project. */

// DEPENDENCIES
// if(!THREE) throw new Error ("ThreeJS library not found");
// let THREE = THREE || {};


// GLOBAL CONSTANTS
const PI2 = Math.PI * 2;
const RAD_TO_DEG = (180 / Math.PI);
const DEG_TO_RAD = (Math.PI / 180) ;

// GLOBAL VARIABLES
let currentTime, deltaTime = 0, deltaTimes = [],
	fpsCounter = 0, lastFpsTime = 0, fpsValue = 0, fpsValues =[];

	
 // POLYFILLS
Number.prototype.mod = function(n) { return ((this % n) + n) % n; }

Array.prototype.pushArray = function() {
	this.push.apply(this, this.concat.apply([], arguments));
};

// GLOBAL FUNCTIONS

/** Creates a new HTML element
 * @param type The type of the element.
 * @param {*} id The id of the element.
 * @param {*} parent The parent of the element.
 * @param {*} style The style of the element.
 * @param {*} innerHTML The inner HTML of the element. */
function createHtmlElement(type, id, parent, style = null, innerHTML = null) {
	let element = document.createElement(type);
	if (id) element.id = id
	if (style) element.style.cssText = style;
	if (innerHTML) element.innerHTML = innerHTML;
	if (parent) parent.appendChild(element)
	return element;
}


// APP DEFINITION

/** Defines an Application Layer. */
class App {

	/** Initializes a new App Instance.
	 * @param name The name of the App.
	 * @param {*} params The creation parameters of the App. */
	constructor (name, params) {

		// Store the type of the class
		this.isApp = true;

		// Check the name parameter
		this.name = name = name || "App" + App.instances.length;

		// Check the given parameters
		params = params || {};

		// Check the different HTML elements
		this.parentElement = params.parentElement || document.body;
		this.wrapperElement = params.parentElement || 
			createHtmlElement('div', name + '_Wrapper', this.parentElement, 
			'width:100%; height:100%; font: 5vmin Arial;');
		this.canvasElement = params.canvasElement || 
			createHtmlElement('canvas', name + '_Canvas', this.wrapperElement, 
			'position: absolute; width:100%; height:100%; z-index: 0;');

		// Create the objects with the loading state data
		this.loading = { element:  params.loadingElement || createHtmlElement(
				'div', 	name + '_Console', this.wrapperElement, 
				'position: absolute; width:100%; height:100%; z-index: 1000;' +
				'background: white; color: blue; font: 5vmin Arial;' +
				'display: flex; justify-content: center; align-items: center;', 
				'<div style="text-align:center"><h2>LOADING</h2><p>[]</p></div>'),
			state: 0, 
			updated: false
		};

		// Create the objects with the console data
		this.console = { element: params.consoleElement || createHtmlElement(
				'div', name + '_Console', this.wrapperElement, 
				'position: absolute; width:100%; height:100%; z-index: 2000;' +
				'background: #00000080; color: white; font: 2vmin Arial;'),
			state: params.consoleState,
			position: params.consolePosition, 
			stats: { fps: 0}, 
			messages: [],
			errorMessage: "",
			updated: false
		};
	

		// Check if we have to add additional elements to the head element
		if (this.parentElement === document.body) {
			createHtmlElement('style', null, document.head, null, 
			'* { margin: 0; cursor: default; overflow: hidden; }\n' + 
			'html, body { width:100%; height:100%; font-family: Verdana; }');
		}
		

		// Create the renderer 
		this.renderer = new THREE.WebGLRenderer({canvas: this.canvasElement});
		this.renderer.autoClear = false;

		// The list of interaction layers
		this.layers = [];

		// Store the external functions
		this.initFunction = params.initFunction || null;
		this.updateFunction = params.updateFunction || null;

		// Call the external initialization function (if there is any)
		if (this.initFunction) this.initFunction(this);
		
		// Add the app to the list (and start updating them after the first)
		if (!App.instances[name]) {
			App.instances[name] = this;
			if (Object.keys(App.instances).length === 1) App.updateAll(0);
		} else throw new Error("App instance '" + name + "' already exists");
	}

	/** Updates the App instance. */
	update() {

		// Clear all the buffers
		this.renderer.clear();

		// Create variables to travel through the different interaction layers
		let layerIndex = 0, layerCount = this.layers.length;

		// Check the size of the wrapper
		let width = this.wrapperElement.clientWidth, 
			height = this.wrapperElement.clientHeight;
		if (this.width !== width || this.height !== height) {
			this.aspectRatio = width / height;
			for	(layerIndex = 0; layerIndex < layerCount; layerIndex++) {
				this.layers[layerIndex].resize(this.aspectRatio);
			}
			this.renderer.setSize( width, height );
			this.renderer.setPixelRatio(window.devicePixelRatio);
			this.width = width; this.height = height;
			console.log("Viewport resized: " + width +"x"+ height);
		}

		// Update the interaction layers
		for	(layerIndex = 0; layerIndex < layerCount; layerIndex++) {
			this.layers[layerIndex].update();
		}

		// Check if the loading screen needs to be updated
		if (!this.loading.updated) {
			let le = this.loading.element;
			switch (this.loading.state) {
				case 0: 
				if (le.style.display !== "none") le.style.display = "none";
				break;
			}
			le.updated = true;
		}

		// Check if the developer console needs to be updated
		if (!this.console.updated) {
			let ce = this.console.element;
			switch (this.console.state) {
				case 0: 
					if (ce.style.display !== "none") ce.style.display = "none";
				break;
				case 1:
					if (ce.style.display !== "block") ce.style.display ="block";
					
					if (fpsCounter == 0) {
						ce.style.height = "3vmin";
						ce.innerHTML = "FPS: " + fpsValue + " Triangles: " + 
							this.renderer.info.render.triangles;

						// If there is a error message, show it
						if (this.console.errorMessage) ce.innerHTML += 
							"<span style=\"color:red; float:right;\"> " +
							this.console.errorMessage + "</span>";
					} 
				break;
			}
			ce.updated = true;
		}



		// Call the external update function (if there is any)
		if (this.updateFunction) this.updateFunction(this);

		// Show a message on console
		// console.log("App Updated: " + this.name);
		// console.log(this.renderer.info);
	}


	/** Updates all the App instances. 
	* @param time The current time (specified by requestAnimationFrame). */
	static updateAll(time = 0) {

		// Update the time counters
		if (currentTime) { 

			// Calculate the delta times
			deltaTime = (time - currentTime) / 1000.0; 
			deltaTimes.push(deltaTime);
			if (deltaTimes.length > 100) deltaTimes.splice(0,1);
	
			// Calculate the FPS value
			lastFpsTime += deltaTime; fpsCounter ++;
			while (lastFpsTime > 1) {
				fpsValue = fpsCounter;
				if (deltaTimes.length > 100) deltaTimes.splice(0,1);
				lastFpsTime -= 1; fpsCounter = 0;
			}
		}
		currentTime = time;
		
		// Clean the console
		// console.clear();
		// console.log("Time: " + (time/1000).toFixed(2) + " (" + 
		// 	(deltaTime * 1000).toFixed(2) + "ms)");

		// Update the data sources
		Source.instances.forEach(source => { source.update(); });

		// Update every single app
		let appNames = Object.keys(App.instances), appCount = appNames.length;
		for (let appIndex = 0; appIndex < appCount; appIndex++) {
			App.instances[appNames[appIndex]].update();
		}

		// Call this function again as soon as possible
		requestAnimationFrame( App.updateAll );
	}
}

/** The static list of Apps. */
App.instances = {};

// When there is a global error, show it in all consoles
window.onerror = function (msg, url, lineNo, columnNo, error) {
	let appNames = Object.keys(App.instances), appCount=appNames.length;
	for (let appIndex = 0; appIndex < appCount; appIndex++)
		App.instances[appNames[appIndex]].console.errorMessage = msg;
}

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
/** Defines a data parameter. */
class Parameter {

	/** Initializes a new Parameter Instance.
	 * @param name The name of the Parameter.
	 * @param parent The parent of the Parameter.
	 * @param params The creation parameters of the Parameter
	 * @param defaultValue The default Value */
	constructor(name, parent, params = {}, defaultValue = 0) {

		// Check the name parameter
		this.name = name || "Parameter";

		// Check the parent parameter
		this.parent = parent;

		// Check the creation parameters
		if (typeof params == "object") {
			if (params.isSource) params = { source: params };
		} else { params = { value: params }; }
		this.value = params.value; this.defaultValue = defaultValue;
		if (this.value == null || this.value == undefined) {
			this.value = defaultValue;
		}

		this.minValue = params.minValue || undefined;
		this.maxValue = params.maxValue || undefined;
		this.source = params.source || undefined;
		this.offset = params.offset || undefined;
		this.factor = params.factor || undefined;

		// Create the fields of the Parameter
		this.updated = false;
		this.isParameter = true;

		if(this.source) {
			this.source.linkedParameters.push(this);
			console.log("Linked " + name + " to " + this.source.name);
		} 
	}


	/** Create a copy of the Parameter.
	 * @param {*} newName The new name of the Parameter.
	 * @param {*} newParent The new parent of the Parameter. */
	clone(newName, newParent) {
		return new Parameter((newName)? newName : this.name, 
			newParent? newParent: this.parent, this);
	}


	/** Get the value of the Parameter.
	 * @returns The current value of the Parameter. */
	get() { return this.update(); }


	/** Set the value of the Parameter.
	 * @param The new value of the Parameter. */
	set(newValue) { 
		if (this.factor !== undefined) newValue *= this.factor;
		if (this.offset !== undefined) newValue += this.offset;
		if (this.minValue !== undefined && newValue < this.minValue) {
			console.log("Parameter " + 
				((this.parent.name)? this.parent.name + "." : "") +
				this.name + " Minimum Value Reached:" + this.minValue)
			newValue = this.minValue;
		}
		if (this.maxValue !== undefined && newValue > this.maxValue) {
			console.log("Parameter " + 
				((this.parent.name)? this.parent.name + "." : "") +
				this.name + " Maximum Value Reached:" + this.maxValue)
			newValue = this.maxValue;
		}
		this.value = newValue; this.downdate();
	}


	/** Downdates the Parameter. */
	downdate() {

		// Make sure that the ValuePoint is *already* updated
		if (!this.updated) return;

		// Mark the ValuePoint as downdated
		this.updated = false; 

		// Downdate the parent (or mark it as "not updated")
		if(this.parent.downdate) this.parent.downdate();
		else if(this.parent.updated) this.parent.updated = false;

		// if (this.source) {
		// 	console.log("Downdating from source");
		// }
	}


	/** Updates the Parameter. */
	update() {

		// If there is a data source, check that first
		if (this.source && this.value !== this.source.value) {
			this.set(this.source.value);
		}

		// Make sure that the Parameter is *not* updated
		if (this.updated) return this.value;

		// Mark the Parameter as updated
		this.updated = true; 

		// Return the value
		return this.value;
	 }


	 /** Gets a string representation of the Parameter.
	  * @returns A string representation of the Parameter. */
	 toString() { return this.value; }
}
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
/** Defines a Sine wave Data Generator. */
class SineWaveGenerator extends Source{

	/** Initializes a new SineWaveGenerator Instance.
	 * @param name The name of the SineWaveGenerator.
	 * @param {*} params The creation parameters of the Generator. */
	constructor(name, params = {}) {

		// Call the parent constructor
		super (name, params)

		this.offset = params.factor || 0;
		this.factor = params.factor || 1000;
		this.minValue = params.minValue || 0;
		this.maxValue = params.maxValue || 1;
	}

	/** Updates the SineWaveGenerator data. */
	update () {
		this.value = (((Math.sin(currentTime/this.factor + this.offset)+1)/2) *
				(this.maxValue - this.minValue)) + this.minValue;

		// Show a message on console
		// console.log("SineWaveGenerator '" + this.name + "':" + this.value);

		// Call the base function
		super.update();
	}
}
/** Defines a Color. */
class Color {

	/** Initializes a new Color Instance.
	 * @param {*} r The red component of the Color.
	 * @param {*} g The green component of the Color.
	 * @param {*} b The blue component of the Color.
	 * @param {*} a The alpha component of the Color. */
	constructor(r = 0, g = 0, b = 0, a = 1) {
		this.r = r; this.g = g; this.b = b; this.a = a;
		this.isColor = true;
		this.updated = false;
		this.parent = null;
	}

	/** Updates the Color instance. */
	update() {
		if (!this.updated) this.updated = true; 
		if (this.parent && this.parent.update) this.parent.update();

		return new THREE.Color(this.r, this.g, this.b);
	}
}
/** Defines a multidimensional Vector. */
class Vector {

	/** Initializes a new Vector Instance. */
	constructor(values) {
		this.values = [];
		this.isVector = true;
		this.updated = false;
		this.dimensions = 2;
		this.parent = null;
		let argIndex = 0, argCount = arguments.length;
		for (argIndex = 0; argIndex < argCount; argIndex++) {
			this.setAt(argIndex, arguments[argIndex]);
		}
	}


	/** Creates a copy of the Widget Instance. */
	clone() { 
		let copy = new Vector(); 
		for (let valueIndex =0; valueIndex < this.values.length; valueIndex++) {
			copy.setAt(valueIndex, this.values[valueIndex]);
		}

		copy.parent = this.parent;
		return copy;
	}


	/** Gets the values of the Vector.
	 * @param {*} dimensions The dimensionality of the returning array
	 * @returns An array with the values of the vector. */
	get(dimensions = -1) { 
		let values = [], valueIndex, size = this.values.length;
		if (dimensions < 0) dimensions = size;
		for (valueIndex= 0; valueIndex < dimensions; valueIndex++) {
			values.push((valueIndex < size)? this.values[valueIndex] : 0);
		}
		return values;
	}


	/** Gets the first value of the vector Instance.
	 * @returns The value to set. */
	getX() { return this.getAt(0); }


	/** Gets the second value of the vector Instance.
	 * @returns The value to set. */
	getY() { return this.getAt(1); }


	/** Gets the third value of the vector Instance.
	 * @returns The third value of the vector. */
	getZ() { return this.getAt(2); }


	/** Get a specific value of a vector.
	 * @param {*} index The index value. */
	getAt(index) { 
		return ((index < this.values.length)? this.values[index]: 0);
	}


	/** Sets the values of the vector Instance.*/
	set() {
		let argIndex = 0, argCount = arguments.length;
		for (argIndex =0; argIndex < argCount; argIndex++) {
			this.setAt(argIndex, arguments[argIndex]);
		}
	 }

	 
	/** Sets the first value of the vector Instance.
	 * @param value The value to set. */
	setX(value) { this.setAt(0, value); }


	/** Sets the second value of the vector Instance.
	 * @param value The value to set. */
	setY(value) { this.setAt(1, value); }


	/** Sets the third value of the vector Instance.
	 * @param value The value to set. */
	setZ(value) { this.setAt(2, value); }


	/** Sets a value of the vector Instance.
	 * @param index The index of the value to set. 
	 * @param value The value to set. */
	setAt(index, value) {
		if (isNaN(value) || !isFinite(value)){
			throw new Error("Invalid value: " + value)
		}
		this.values[index] = value;
		if (index == 0) this.x = value;
		else if (index == 1) this.y = value;
		else if (index == 2) this.z = value;
		this.updated = false;
		this.dimensions = this.values.length;
		if (this.parent) this.parent.updated = false;
	 }


	/** Updates the Vector instance. */
	update() { if (!this.updated) this.updated = true; }


	/** Obtains a string representation of the Vector instance.
	 * @digits The number of digits after the decimal point.
	 * @returns A string representation of the Vector instance. */
	toString(digits = 2) { 
		let valueString = "";
		this.values.forEach((value, index) => {
			valueString += ((index>0)? ", " : "") + value.toFixed(digits);
		});
		return '{' + valueString + '}';
	}
	

	/** Compares two Vector instances
	 * @param v1 The first Vector instance.
	 * @param v2 The second Vector instance.
	 * @returns A boolean value with the comparison result. */
	static equals(v1, v2) {
		if (!v1 || !v2) return false;
		if (v1.values.length !== v2.values.length) return false;
		let s = 0.00001; // Sigma value required
		for (let valueIndex = 0; valueIndex < v1.values.length; valueIndex++) {
			if (v1.values[valueIndex] + s < v2.values[valueIndex]) return false;
			if (v1.values[valueIndex] - s > v2.values[valueIndex]) return false;
		}
		return true;
	}
}

/* Defines a geometric Font */
class Font {

	/** Initializes a new CameraController Instance.
	 * @param name The name of the Font.
	 * @param filePath The Path to the file containing the JS Font.*/
	constructor (name, filePath) {
		
		// Check the given values
		if (!name) throw new Error("Invalid font name");
		if (!filePath) throw new Error("Invalid font filePath");

		
		// Create the fields of the Font
		this.name = name; 
		this.filePath = filePath;
		this.loaded = false;
		this.glyphs = {};

		// Load the file
		this.file = new File("Font " + name, { path: filePath,
			onload : (file) => { this.loadJson(file.data); }});

		// Add the instance
		if (!Font.instances[name]) Font.instances[name] = this;
		else throw new Error("Font '" + name + "' already exists");
	}

	/** Loads a JSON font file.
	 * @param {*} data The JSON object with the font data.*/
	loadJson (data) {
		// Mark the font as not loaded
		this.loaded = false;

		// Get the main parameters of the font
		this.resolution = data.resolution;
		this.ascender = data.ascender / data.resolution;
		this.descender = data.descender / data.resolution;
		this.lineHeight = this.ascender - this.descender;

		// Create a shape for every glyph
		this.glyphs = {}; let scaleFactor = 1 / this.resolution;
		let glyphKeys = Object.keys(data.glyphs), glyphCount = glyphKeys.length;
		for (let glyphIndex = 0; glyphIndex < glyphCount; glyphIndex++) {
			let glyphKey = glyphKeys[glyphIndex], 
				glyphData = data.glyphs[glyphKey],
				glyphSvgData = glyphData.o;
				if (!glyphSvgData) continue;
			let path = ShapeUtils.readSvgPath(glyphSvgData,{scale:scaleFactor});
			path.reversed = true;
			path.update(true, {dimensions:2});
			this.glyphs[glyphKey] = {path: path, ha: glyphData.ha/data.resolution};
		}


		// Mark the font as loaded
		this.loaded = true;
	}
}

/** The static list of Fonts. */
Font.instances = {};

/** Defines a Geometric Modifier. */
class Modifier {

	/** Initializes a new Modifier instance. 
	 * @param {*} params The creation parameters of the Modifier. */
	constructor(params = {}) {
	}

	/** Applies the modifier. */
	apply(polylines) {

	}
}

/** Defines a Geometric Path. */
class Path {

	/** Initializes a new Path instance. 
	 * @param {*} params The creation parameters of the Path. */
	constructor(params = {}) {

		// Define the segments of the Path
		this.segments = []; 
		if (params.segments) params.segments.forEach(
			segment => { this.segments.push(segment.clone()); }
		);
	
		// Define the data elements of the Path
		let data = this.data = {};
		data.parts		= params.parts		|| [];
		data.vertices	= params.vertices	|| [];
		data.lengths	= params.lengths	|| [];
		data.tangents	= params.tangents	|| [];
		data.normals	= params.normals	|| [];
		data.binormals	= params.binormals	|| [];
		data.edges		= params.edges		|| [];
		data.holes		= params.holes		|| [];
		data.faces		= params.faces		|| [];
		data.vertexCount = 0;

		// Copy the modifiers
		this.modifiers = [];
		if (params.modifiers) this.modifiers = [...params.modifiers];
		
		// Define the properties of the Path
		this.isPath = true;
		this.reverse = params.reversed || false;
		this.updated = params.updated || false;
		this.dimensions = params.dimensions || 0; 
	}


	/** Create a copy of the Path. */
	clone() { return new Path(this); }

	/** Combines this Path with another. 
	 * @param path The path to join with.
	 * @returns The current path instance. */
	join(path, position = null, rotation = null, scale = null) {

		// Make sure both the current path and the resulting path are updated
		if(!this.updated) this.update();
		if(!path.updated) path.update();

		// Add the segments
		this.segments.pushArray(path.segments); 

		// Create variables to operate with the data
		let dataOffset = this.data.vertices.length /3,
			vertexDataSize = path.data.vertices.length, 
			edgeDataSize = path.data.edges.length,
			faceDataSize = path.data.faces.length;
		
		// Add the vertex data
		for (let vertexIndex = 0; vertexIndex < vertexDataSize; vertexIndex++) {
			let vertexPosition = path.data.vertices[vertexIndex];
			if (position) vertexPosition += position.getAt(vertexIndex % 3);
			if (scale) vertexPosition *= scale.getAt(vertexIndex % 3);

			this.data.vertices.push(vertexPosition);
			this.data.tangents.push(path.data.tangents[vertexIndex]);
			this.data.normals.push(path.data.normals[vertexIndex]);
			this.data.binormals.push(path.data.binormals[vertexIndex]);
		}

		// Add the edge data
		for (let edgeIndex = 0; edgeIndex < edgeDataSize; edgeIndex++) {
			this.data.edges.push(path.data.edges[edgeIndex] + dataOffset);
		}

		// Add the face data
		for (let faceIndex = 0; faceIndex < faceDataSize; faceIndex++) {
			this.data.faces.push(path.data.faces[faceIndex] + dataOffset);
		}

		// Update the number of vertices
		this.data.vertexCount = this.data.vertices.length / 3;


		// Mark the form as updated
		this.updated = true;

		// Return the current path instance
		return this; 
	}


	/** Updates the Path data.
	* @param {*} forced Indicates whether to force the update or not.
	* @param {*} params The update parameters parameters. */
	update(forced, params = {}) {
		
		// Check if the Path must be updated
		if(this.updated && !forced) return;

		// Reset the data
		let data = this.data;
		data.parts = []; data.vertices = []; 
		data.lengths = []; data.angles = []; 
		data.tangents = []; data.normals = []; data.binormals = []; 
		data.edges = []; data.holes = [], data.faces = [];
				
		// Create several variables to operate with the segments of the path
		let segmentIndex = 0, segmentCount = this.segments.length;
		if (segmentCount == 0) return;
		

		// Check the dimensions of the segments
		if (params.dimensions) this.dimensions = params.dimensions;
		else {
			this.dimensions = 2;
			for (segmentIndex = 0; segmentIndex < segmentCount; segmentIndex++){
				this.segments[segmentIndex].update();
				const segmentDims = this.segments[segmentIndex].dimensions;
				if (this.dimensions<segmentDims) this.dimensions = segmentDims;
			}
		}

		// Define the properties for the interpolation
		let dimensions = this.dimensions, planar = (this.dimensions == 2),
			sigma = 0.001,
			minLength = params.minLength || sigma,
		 	maxLength = params.maxLength || Infinity,
			minAngle = params.minAngle || sigma,
			maxAngle = params.maxAngle || Segment.defaultMaxAngle,
			interpolateAngles = params.interpolateAngles || false,
			reversed = params.reversed || this.reversed;
		if (minLength > maxLength) minLength = maxLength;
		if (minAngle > maxAngle) minAngle = maxAngle;

		// Interpolate the segments and obtain the different parts (polylines)
		let part = {vertices:[], closed: false}, allPartsClosed = true,
			partPointStart = this.segments[0].pointStart;
		for (segmentIndex = 0; segmentIndex < segmentCount; segmentIndex++) {
			const segment = this.segments[segmentIndex],
				nextSegment = this.segments[(segmentIndex + 1) % segmentCount],
				chained=Vector.equals(segment.pointEnd, nextSegment.pointStart);
			segment.update(true,{dimensions:dimensions, skipLastPoint:chained});
			part.vertices.pushArray(segment.vertices);
			if (!chained || segmentIndex==segmentCount-1) {
				part.closed = Vector.equals(segment.pointEnd, partPointStart);
				if (!part.closed) allPartsClosed = false;
				data.parts.push(part);
				part = { vertices:[], closed: false };
				partPointStart = nextSegment.pointStart;
			}
		}

		if (reversed) {
			// Process the different parts
			let partIndex = 0, partCount = data.parts.length;
			for (partIndex = 0; partIndex < partCount; partIndex++) {
				let part = data.parts[partIndex], newVertices = [];
				let vertexIndex = 0, vertexCount = part.vertices.length / 2;
				for (vertexIndex = vertexCount-1; vertexIndex >= 0; vertexIndex--) {
					let vertexDataIndex = vertexIndex * 2;
					let xA = part.vertices[vertexDataIndex++],
						yA = part.vertices[vertexDataIndex++];
					newVertices.push(xA,yA);
				}
				part.vertices = newVertices;
			}
		}

		// Apply the modifiers
		let modifierIndex = 0, modifierCount = this.modifiers.length;
		for (modifierIndex = 0; modifierIndex < modifierCount; modifierIndex++){
			this.modifiers[modifierIndex].apply(data.parts);
		}
		
		

		// Process the different parts
		let partIndex = 0, partCount = data.parts.length;
		for (partIndex = 0; partIndex < partCount; partIndex++) {

			// Get the current part
			let part = data.parts[partIndex];

			// Create the necessary variables
			let posX, posY, posZ = 0, // Current vertex Position
				nextX, nextY, nextZ = 0, // Next vertex Position
				tangentX, tangentY, tangentZ = 0,
				normalX = 0, normalY = 0, normalZ = 1,
				binormalX = 0, binormalY = 0, binormalZ = -1,
				previousNormalX, previousNormalY, previousNormalZ = 0,
				smoothNormalX, smoothNormalY, smoothNormalZ = 0,
				previousTangentX, previousTangentY, previousTangentZ,
				length, angle;
				
			// If the path is closed, precalculate the last part
			if (part.closed) {
				let d = part.vertices.length - dimensions,
					tX = part.vertices[0] - part.vertices[d++],
					tY = part.vertices[1] - part.vertices[d++],
					tZ = (!planar)? part.vertices[2] - part.vertices[d++] : 0;
				length = Math.sqrt((tX * tX) + (tY * tY) + (tZ * tZ));
				if (length > 0) {
					previousTangentX = tX/length; previousTangentY = tY/length; 
					previousTangentZ = (!planar)? tZ/length : 0;

					if (planar) {
						previousNormalX = -previousTangentY;
						previousNormalY = previousTangentX; 
						previousNormalZ = 0;
					}
					else {
						previousNormalX = 1; previousNormalY = 0; 
						previousNormalZ = 0;
					}
				}
			}

			// Parse each vertex of the part
			let vertexIndex = 0, vertexCount = part.vertices.length/dimensions,
				nextVertexIndex, isFirstVertex = true, isLastVertex = false;
			while (vertexIndex < vertexCount) {

				// Calculate the next vertex index
				nextVertexIndex = vertexIndex + 1;
				isFirstVertex = (vertexIndex == 0);
				isLastVertex = (nextVertexIndex == vertexCount);


				// Get the position of the current vertex
				let vertexDataIndex = vertexIndex * dimensions;
				posX = part.vertices[vertexDataIndex];
				posY = part.vertices[vertexDataIndex+1];
				posZ = (!planar)? part.vertices[vertexDataIndex+2] : 0;

				let smoothed = false;
				
				// Calculate the length and angle within the given range
				let finalVertexIndex = vertexCount + ((part.closed)? 1: 0);
				while (nextVertexIndex <= finalVertexIndex) {

					// If the part is open, don't process the last vertex
					if(!part.closed && isLastVertex) break;
					
					// Get the position of the next vertex
					vertexDataIndex = (nextVertexIndex%vertexCount)*dimensions;
					nextX = part.vertices[vertexDataIndex];
					nextY = part.vertices[vertexDataIndex+1];
					nextZ = (!planar)? part.vertices[vertexDataIndex+2] : 0;

					// Calculate the length, tangent and angle
					if (planar) {
						let tX = nextX - posX, tY = nextY - posY;
						length = Math.sqrt((tX * tX) + (tY * tY));
						tangentX = tX/length; tangentY = tY/length;
						if (isFirstVertex && !part.closed) angle = minAngle;
						else angle = Math.acos((tangentX * previousTangentX) + 
							(tangentY * previousTangentY)) * RAD_TO_DEG;
						binormalX = 0; binormalY = 0; binormalZ = -1;
						normalX = -tangentY; normalY = tangentX; normalZ = 0;
					} else {
						let tX = nextX-posX, tY = nextY-posY, tZ = nextZ-posZ;
						length = Math.sqrt((tX * tX) + (tY * tY) + (tZ * tZ));
						tangentX = tX/length; tangentY = tY/length; 
						tangentZ = tZ/length;
						if (isFirstVertex && !part.closed) angle = minAngle;
						else angle = Math.acos((tangentX * previousTangentX) + 
								(tangentY * previousTangentY) + 
								(tangentZ * previousTangentZ)) * RAD_TO_DEG;
						binormalX = 0; binormalY = 1; binormalZ = 0;
						normalX = 1; normalY = 0; normalZ = 0;
					}

					// If the angle is too small, skip this vertex
					if (angle < minAngle && !isLastVertex) { 
						nextVertexIndex++; continue;
					}

					// If the angle is too steep, duplicate the vertices
					if (angle > maxAngle+sigma) {
						data.lengths.push(0); data.angles.push(angle);
						data.vertices.push(posX, posY, posZ);
						data.tangents.push(tangentX, tangentY, tangentZ);
						data.normals.push(previousNormalX, 
							previousNormalY, previousNormalZ);
						data.binormals.push(binormalX, binormalY, binormalZ);
					}

					// If the length and the angle are with the parameters
					if (length>minLength && (isFirstVertex || angle>minAngle)) {
						//Smooth the normal
						let sX = (previousNormalX + normalX) / 2,
							sY = (previousNormalY + normalY) / 2,
							sZ = (previousNormalZ + normalZ) / 2,
							ls = Math.sqrt((sX * sX) + (sY * sY) + (sZ * sZ));
						if (ls > 0 && angle < maxAngle + sigma) {
							smoothed = true;
							smoothNormalX = sX / ls;
							smoothNormalY = sY / ls;
							smoothNormalZ = sZ / ls;

							if (isNaN(smoothNormalX)) smoothNormalX = normalX;
							if (isNaN(smoothNormalY)) smoothNormalY = normalY;
							if (isNaN(smoothNormalZ)) smoothNormalZ = normalZ;
						}
						break;
					}
					nextVertexIndex++;
				}

				// Save the vertex data (always in 3D)
				data.lengths.push(length); data.angles.push(angle);
				data.vertices.push(posX, posY, posZ);
				data.tangents.push(tangentX, tangentY, tangentZ);
				data.binormals.push(binormalX, binormalY, binormalZ);
				if (smoothed) data.normals.push(
					smoothNormalX, smoothNormalY, smoothNormalZ);
				else data.normals.push(normalX, normalY, normalZ);
				
				previousTangentX = tangentX;
				previousTangentY = tangentY;
				previousTangentZ = tangentZ;

				previousNormalX = normalX;
				previousNormalY = normalY;
				previousNormalZ = normalZ;

				// Go to the next vertex index
				vertexIndex = nextVertexIndex;
			}

			// Create the edges
			vertexIndex = data.vertexCount;
			let lastVertexIndex = (data.vertices.length / 3) - 1;
			while (vertexIndex <= lastVertexIndex) {
				if (data.lengths[vertexIndex] > 0) {
					nextVertexIndex = vertexIndex + 1;
					if (vertexIndex == lastVertexIndex) {
						if (!part.closed) break;
						nextVertexIndex = data.vertexCount;
					}
					data.edges.push(vertexIndex, nextVertexIndex);
				}
				vertexIndex++;
			}

			// Update the vertex count
			data.vertexCount = data.vertices.length / 3;

			// If its the last vertex and its not the last part, add a hole
			if (partIndex < (partCount - 1)) data.holes.push(data.vertexCount);
		}

		// Create the faces
		if (planar && allPartsClosed) {

			let vertices = data.vertices, holes = data.holes, 
				triangleData, offset = 0;

			// If there is more than one part, make sure to process them
			if (partCount > 1) {
				for (partIndex = 0; partIndex < partCount; partIndex++) {
					
					// Calculate the data
					triangleData = Earcut.triangulate(vertices, holes, 3);

					// Copy the data, adding  offset
					let dataIndex = 0, dataSize = triangleData.length;
					if (dataSize == 0) break;
					for (dataIndex = 0; dataIndex < dataSize; dataIndex++) {
						let vertexIndex = triangleData[dataIndex] + offset;
						data.faces.push(vertexIndex);

						// Check if the value is part of a part index
						if (partIndex < partCount && 
							vertexIndex > data.holes[partIndex]) partIndex++;
					}

					// if there is still parts without holes, update the data
					if (partIndex < partCount) {
						offset = data.holes[partIndex]; 
						vertices = data.vertices.slice(offset * 3);
						holes = data.holes.slice(partIndex+1);
						let holeIndex, holeCount = holes.length;
						for (holeIndex = 0; holeIndex < holeCount; holeIndex++)
							holes[holeIndex] -= offset;
					}
				}
			} else data.faces = Earcut.triangulate(vertices, holes, 3);

		}

		// Mark the path as updated
		this.updated = true;

		// Show a message on console
		// console.log("Path updated");
	}
}
/** Defines a Geometric Segment. */
class Segment {

	/** Initializes a new Segment Instance.
	 * @param {*} params The creation parameters of the Segment. */
	constructor(params = {}) { 
		
		// Define the properties of the Segment
		this.updated = params.updated || false;
		this.dimensions = params.dimensions || 2;
		this.pointStart = params.pointStart || new Vector(0,0);
		this.pointEnd = params.pointEnd || new Vector(1,0);

		// Define the data components of the Segment
		this.vertices = [];
		if (params.vertices) params.vertices.forEach(
			vertex => { this.vertices.push(vertex.clone()); }
		); 
	}

	/** Updates the Segment data.
	* @param {*} forced Indicates whether to force the update or not.
	* @param {*} params The update parameters of the Segment. */
	update(forced = false, params = {}) {
	
		// // Check if the Segment must be updated
		// if(this.updated && !forced) return;

		// Mark the segment as updated
		this.updated = true;

		// Return the vertex data
		return this.vertices;
	}
}


// Static/Global variables
Segment.defaultSteps = 4;
Segment.defaultMaxAngle = 15;

/** Defines a Geometric Shape. */
class Shape {

	/** Initializes a new Shape Instance.
	 * @param {*} name The name of the Shape.
	 * @param {*} parent The parent of the Shape.
	 * @param {*} params The creation parameters of the Shape. */
	constructor(name, parent, params = {}) {

		// Check the given parameters
		this.name = name || "[Shape]";
		this.parent = parent;

		// Store the type of the class
		this.isShape = true;

		// Indicates if the Shape is updated (or needs to be updated)
		this.updated = false;

		// Check the creation parameters
		this.color = params.color || new Color(1, 1, 1, 1);
		this.materialType = new Parameter("MaterialType", this,
			params.materialType || 'lambert');
		this.materialSide = new Parameter("MaterialSide", this,
			params.materialSide || 'front');
		this.debug = params.debug || false;
		this.materialWireframe = params.materialWireframe || true;
		this.vertexBufferSize = 0; this.indexBufferSize = 0;

		// Copy the modifiers
		this.modifiers = [];
		if (params.modifiers) this.modifiers = [...params.modifiers];

		// Create the transformations
		this.position = params.position || new Vector(0, 0, 0);
		this.rotation = params.rotation || new Vector(0, 0, 0);
		this.scale = params.scale || new Vector(1, 1, 1);
		this.position.parent = this;
		this.rotation.parent = this; 
		this.scale.parent = this; 

		// Create the ThreeJS Mesh associated with this Shape
		this.geometry = new THREE.BufferGeometry();
		this.geometry.setAttribute('position', 
			new THREE.Float32BufferAttribute(this.vertexBufferSize, 3));
		this.geometry.setAttribute('normal', 
			new THREE.Float32BufferAttribute(this.vertexBufferSize, 3));

		this.material = new THREE.MeshPhongMaterial();
		this.mesh = new THREE.Mesh(this.geometry, this.material);
		this.mesh.name = this.name;
	}


	/** Create a copy of the Shape.
	* @param {*} newName The name of the Shape copy.
	* @param {*} newParent The parent 3DObject of the Shape copy. */
	clone(newName, newParent) {
		return new Shape( (newName)? newName : this.name + "Copy",
			(newParent)? newParent : this.parent, this);
	}


	/** Downdates the Shape. */
	downdate() { 

		// Mark the ValuePoint as downdated
		this.updated = false;

		// Downdate the parent (or mark it as "not updated")
		if(this.parent.downdate) this.parent.downdate();
		else if(this.parent.updated) this.parent.updated = false;
		// console.log("Shape Changed: " + this.name);
	}

	
	/** Updates the Shape.
	 * @param {*} forced Indicates whether to force the update or not. */
	update(forced) {

		// Check if the Shape must be updated
		if(this.updated && !forced) return;

		// Apply the transformations
		let p = this.position, r = this.rotation, s = this.scale;
		if (!p.updated) {
			p.update(); this.mesh.position.set(p.getX(), p.getY(), p.getZ());
		}
		if (!r.updated) { r.update(); this.mesh.setRotationFromEuler(
			new THREE.Euler(r.x*RAD_TO_DEG, r.y*RAD_TO_DEG, r.z*RAD_TO_DEG)); }
		if (!s.updated) { s.update(); this.mesh.scale.set(s.x, s.y, s.z); }
	
		// If there is no geometry, create an "X" to symbolize an error
		let geometry = this.geometry;
		if (this.vertexBufferSize < 0) {
			let vertexData = new THREE.Float32BufferAttribute([
				0.0,  0.2, 0,	-0.2,  0.0, 0,	 0.0, -0.2, 0,
				0.0, -0.2, 0,	 0.2,  0.0, 0,	 0.0,  0.2, 0,
				0.0,  0.2, 0,	-0.8,  1.0, 0,	-1.0,  0.8, 0,
				-1.0,  0.8, 0,	-0.2,  0.0, 0,	 0.0,  0.2, 0,
				-0.2,  0.0, 0,	-1.0, -0.8, 0,	-0.8, -1.0, 0,
				-0.8, -1.0, 0,	 0.0, -0.2, 0,	-0.2,  0.0, 0,
				0.0, -0.2, 0,	 0.8, -1.0, 0,	 1.0, -0.8, 0,
				1.0, -0.8, 0,	 0.2,  0.0, 0,	 0.0, -0.2, 0,
				0.2,  0.0, 0,	 1.0,  0.8, 0,	 0.8,  1.0, 0,
				0.8,  1.0, 0,	 0.0,  0.2, 0,	 0.2,  0.0, 0,

				0.0,  0.2, 0,	 0.0, -0.2, 0,	-0.2,  0.0, 0,
				0.0, -0.2, 0,	 0.0,  0.2, 0,	 0.2,  0.0, 0,
				0.0,  0.2, 0,	-1.0,  0.8, 0,	-0.8,  1.0, 0,
				-1.0,  0.8, 0,	 0.0,  0.2, 0,	-0.2,  0.0, 0,
				-0.2,  0.0, 0,	-0.8, -1.0, 0,	-1.0, -0.8, 0,
				-0.8, -1.0, 0,	-0.2,  0.0, 0,	 0.0, -0.2, 0,
				0.0, -0.2, 0,	 1.0, -0.8, 0,	 0.8, -1.0, 0,
				1.0, -0.8, 0,	 0.0, -0.2, 0,	 0.2,  0.0, 0,
				0.2,  0.0, 0,	 0.8,  1.0, 0,	 1.0,  0.8, 0,
				0.8,  1.0, 0,	 0.2,  0.0, 0,	 0.0,  0.2, 0,
			],3);
			this.vertexBufferSize = vertexData.length;
			geometry.setAttribute('position', vertexData);
			geometry.boundingSphere = new THREE.Sphere(0,2);
			geometry.attributes.position.needsUpdate = true;
			geometry.verticesNeedUpdate = true;
			this.materialType.set('basic'); this.color = new Color(1,0,0);
		}


		// Check the material type
		let updatedMaterial = !this.materialType.updated || 
							!this.materialSide.updated;
		if (updatedMaterial) {
			switch (this.materialType.update()) {
				case 'basic': 
					this.material = new THREE.MeshBasicMaterial(); break;
				case 'lambert':
					this.material = new THREE.MeshLambertMaterial(); break;
				case 'phong':
					this.material = new THREE.MeshPhongMaterial(); break;
				case 'pbr':
					this.material = new THREE.MeshStandardMaterial(); break;
				case 'toon':
					this.material = new THREE.MeshToonMaterial(); break;
				default: throw new Error ('Invalid material type for shape "' +
					this.name + '". Valid options are:' +
					 ' "basic", "phong", "lambert", "pbr" or "toon"' );
			}
			this.mesh.material = this.material;

			switch (this.materialSide.update()) {
				case 'front': 
					this.material.side = THREE.FontSide; break;
				case 'back':
					this.material.side = THREE.BackSide; break;
				case 'double':
					this.material.side = THREE.DoubleSide; break;
			}
		}

		// Check the material color
		if (updatedMaterial || !this.color.updated) {
			this.material.color = this.color.update();
			this.material.opacity = this.color.a;
			this.material.transparent = (this.color.a < 1);
		}

		// Mark the shape as updated
		this.updated = true;

		// Show a message on console
		// console.log("Shape Updated: " + this.name);
	}
}
/* Provides several functions to operate with profile. */
class ShapeUtils {

	/** Creates a Shape by extruding a Path along another Path. 
	 * @param shape The Shape to generate.
	 * @param profile The profile Path to extrude.
	 * @param {*} path The extrusion Path (or a number with its height). 
	 * @param {*} params Additional extrusion parameters. */
	static extrude (shape, profile, path = 0, params = {}) {

		// Operate over the shape geometry
		let geometry = shape.geometry;

		// Process the additional parameters
		let cap = params.cap || true,
			debug = params.debug || shape.debug || false,
			computeNormals = params.computeNormals || true,
			computeUvs = params.computeUvs || true,
			sides = params.sides || 2;

		let vertices, normals, faces = [],
			vertexDataIndex = 0, normalDataIndex = 0, faceDataIndex = 0;

		if (sides < 1) sides = 1; if (sides > 2) sides = 2;

			
		// Check if the profile and paths have to be updated
		let profileUpdated = false, pathUpdated = false;
		
		// Check the profile
		if (!profile||!profile.isPath) throw Error('Invalid extrusion profile');
		if (!profile.updated) { profile.update(); profileUpdated = true; }
		let profileVertices = profile.data.vertices,
			profileVertexDataSize = profileVertices.length,
			profileNormals = profile.data.normals,
			profileEdges = profile.data.edges,
			profileEdgeDataSize = profileEdges.length,
			profileFaces = profile.data.faces,
			profileFaceDataSize = profileFaces.length,
			profilePointCount = profileVertexDataSize / 3;

		// Check the path
		if (path !== 0) {
		
			let pathIsVertical = false;
			if (typeof path == "number") {
				if (!geometry.extrusionDepth||geometry.extrusionDepth !== path){
					geometry.extrusionDepth = path; pathUpdated = true;
				}
				path = new Path({segments: [new LineSegment({
					pointStart: new Vector(),
					pointEnd: new Vector(0, 0, path)})]});
				pathIsVertical = true;
			}

			// Create the elements of the geometry
			if (!path.updated) { path.update(); pathUpdated = true; }
			let pathVertexDataSize = path.data.vertices.length,
				pathPointCount = pathVertexDataSize / 3;
			if (!pathIsVertical) { // Check if the path is vertical
				pathIsVertical = true;
				for (let pointIndex=0; pointIndex<pathPointCount; pointIndex++){
					let vertexDataIndex = pointIndex * 3;
					if (path.data.vertices[vertexDataIndex] !== 0 ||
						path.data.vertices[vertexDataIndex + 1] !== 0 ) {
						pathIsVertical = false; break;
					}
				}
			}

			// If both the profile and the path have not been updated, do nothing
			if (!profileUpdated && !pathUpdated) return;

			if (profileFaces.length == 0) cap = false;

			// Calculate the number of vertices
			let	capCount = ((cap == true)? (path.data.holes.length+1)*sides:0),
				vertexDataSize=profileVertexDataSize*(pathPointCount+capCount);
			if (shape.vertexBufferSize < vertexDataSize) {
				shape.vertexBufferSize = vertexDataSize;
				shape.geometry.setAttribute('position', 
					new THREE.Float32BufferAttribute(vertexDataSize, 3));
				shape.geometry.setAttribute('normal', 
					new THREE.Float32BufferAttribute(vertexDataSize, 3));
			}
			vertices = geometry.attributes.position.array;
			normals = geometry.attributes.normal.array;


			// Create the geometry for each path point
			for (let pathPointIndex = 0; pathPointIndex < pathPointCount;
				pathPointIndex++) {
				
				// Get the position of the path point
				let pathPointDataIndex = pathPointIndex * 3,
					pX = path.data.vertices[pathPointDataIndex],
					pY = path.data.vertices[pathPointDataIndex + 1],
					pZ = path.data.vertices[pathPointDataIndex + 2],
					nX = path.data.normals[pathPointDataIndex],
					nY = path.data.normals[pathPointDataIndex + 1],
					nZ = path.data.normals[pathPointDataIndex + 2],
					bX = path.data.binormals[pathPointDataIndex],
					bY = path.data.binormals[pathPointDataIndex + 1],
					bZ = path.data.binormals[pathPointDataIndex + 2];

				// Calculate the position of the vertices for this path point
				for (let profilePointIndex = 0;
					profilePointIndex < profileVertexDataSize; 
					profilePointIndex += 3) {

					// Compute the vertices
					let posX = profileVertices[profilePointIndex],
						posY = profileVertices[profilePointIndex+1],
						posZ = profileVertices[profilePointIndex+2];

					vertices[vertexDataIndex++]	= pX + (posX*nX + posY*bX);
					vertices[vertexDataIndex++]	= pY + (posX*nY + posY*bY);
					vertices[vertexDataIndex++]	= (pathIsVertical)? pZ + posZ:
						pZ + (posX*nZ + posY*bZ);

					// Compute the normals
					if (computeNormals) {
						let normalX = profileNormals[profilePointIndex],
							normalY = profileNormals[profilePointIndex+1],
							normalZ = profileNormals[profilePointIndex+2];

						normals[normalDataIndex++] = -(normalX*nX+ normalY*bX);
						normals[normalDataIndex++] = -(normalX*nY+ normalY*bY);
						normals[normalDataIndex++] = (pathIsVertical)? 0: 
							-(normalX*nZ+ normalY*bZ);
					}
				}

				// If its the last path point, just creates vertices
				if (pathPointIndex == pathPointCount - 1) break;

				// Create the edge faces
				let faceOffset = profileEdgeDataSize * pathPointIndex;
				for (let edgeIndex = 0; edgeIndex < profileEdgeDataSize;
					edgeIndex += 2, faceDataIndex += 6) {
					let f0 = profileEdges[edgeIndex + 0] + faceOffset,
						f1 = profileEdges[edgeIndex + 1] + faceOffset,
						f2 = f0 + profilePointCount,
						f3 = f1 + profilePointCount;
					faces.push(f0);faces.push(f1);faces.push(f2);
					faces.push(f2);faces.push(f1);faces.push(f3);
				}
			}

			// Create the caps (if the profile has faces)
			if (cap && profileFaceDataSize > 0) {

				// Create an array of holes in the path
				let holes = [0]; holes.pushArray(path.data.holes);
				
				let dataSize = profileVertexDataSize * pathPointCount;
				let faceOffset;

				// 
				for (let holeIndex = 0; holeIndex < holes.length; holeIndex++) {
					const holePointIndex = holes[holeIndex];

					let capStartIndex = holePointIndex, capEndIndex = 
						(holePointIndex>0)? holePointIndex-1 : pathPointCount-1,
						capStartDataIndex = capStartIndex*profileVertexDataSize, 
						CapEndDataIndex = capEndIndex*profileVertexDataSize;
						
					// Copy the vertex data to create the closing cap
					for (let pi = 0; pi < profilePointCount; pi++) {
						
						// Copy the vertex data
						let vertexIndex = CapEndDataIndex + pi * 3;
						vertices[vertexDataIndex++] = vertices[vertexIndex++];
						vertices[vertexDataIndex++] = vertices[vertexIndex++];
						vertices[vertexDataIndex++] = vertices[vertexIndex++];

						// Compute the normals
						if (computeNormals) {
							normals[normalDataIndex++] = 0;
							normals[normalDataIndex++] = 0;
							normals[normalDataIndex++] = 1;
						}
					}

					// Create the faces
					faceOffset = (vertexDataIndex - profileVertexDataSize) / 3;
					for (let fdi = 0; fdi < profileFaceDataSize; fdi += 3) {
						faces.push(profileFaces[fdi] + faceOffset);
						faces.push(profileFaces[fdi + 1] + faceOffset);
						faces.push(profileFaces[fdi + 2] + faceOffset);
					}


					// Copy the vertex data to create the closing cap
					for (let pi = 0; pi < profilePointCount; pi++) {
	
						// Copy the vertex data
						let vertexIndex = capStartDataIndex + pi * 3;
						vertices[vertexDataIndex++] = vertices[vertexIndex++];
						vertices[vertexDataIndex++] = vertices[vertexIndex++];
						vertices[vertexDataIndex++] = vertices[vertexIndex++];

						// Compute the normals
						if (computeNormals) {
							normals[normalDataIndex++] = 0;
							normals[normalDataIndex++] = 0;
							normals[normalDataIndex++] = -1;
						}
					}

					// Create the faces
					faceOffset = (vertexDataIndex - profileVertexDataSize) / 3;
					for (let fdi = 0; fdi < profileFaceDataSize; fdi += 3) {
						faces.push(profileFaces[fdi] + faceOffset);
						faces.push(profileFaces[fdi + 2] + faceOffset);
						faces.push(profileFaces[fdi + 1] + faceOffset);
					}
				}
			}
		} else { // if there is no path, just create the faces

			// Calculate the number of vertices
			let	vertexDataSize = profileVertexDataSize * sides;
			if (shape.vertexBufferSize < vertexDataSize) {
				shape.vertexBufferSize = vertexDataSize;
				shape.geometry.setAttribute('position', 
					new THREE.Float32BufferAttribute(vertexDataSize, 3));
				shape.geometry.setAttribute('normal', 
					new THREE.Float32BufferAttribute(vertexDataSize, 3));
			}
			vertices = geometry.attributes.position.array;
			normals = geometry.attributes.normal.array;

			// Create the geometry for one or two sides
			for (let side = 0; side < sides; side++) {

				// Copy the vertex data
				for (let vdi = 0; vdi < profileVertexDataSize; vdi++) {
					vertices[vertexDataIndex++] = profileVertices[vdi];
				}

				// Compute the normal data
				if (computeNormals) {
					let normalZ = (side == 0)? +1 : -1;
					for (let ndi = 0; ndi < profileVertexDataSize; ndi += 3) {
						normals[normalDataIndex++] = 0;
						normals[normalDataIndex++] = 0;
						normals[normalDataIndex++] = normalZ;
					}
				}

				// Compute the faces
				let faceOffset = profileVertexDataSize / 3;
				for (let fdi = 0; fdi < profileFaceDataSize; fdi += 3) {
					if (side == 0) {
						faces.push(profileFaces[fdi]);
						faces.push(profileFaces[fdi + 1]);
						faces.push(profileFaces[fdi + 2]);
					} else {
						faces.push(profileFaces[fdi] + faceOffset);
						faces.push(profileFaces[fdi + 2] + faceOffset);
						faces.push(profileFaces[fdi + 1] + faceOffset);
					}
				}
			}
		} 

		// Set the faces and mak the Buffered geometry to be updated
		geometry.setIndex(faces);
		geometry.setDrawRange(0, faces.length);
		geometry.attributes.position.needsUpdate = true;
		geometry.attributes.normal.needsUpdate = true;
		geometry.index.needsUpdate = true;
		geometry.verticesNeedUpdate = true;
		geometry.normalsNeedUpdate = true;
		geometry.elementsNeedUpdate = true;
		// geometry.computeVertexNormals();
		geometry.boundingSphere = new THREE.Sphere(0,2);
		// geometry.computeBoundingSphere();

		// Draw the debug elements
		if (debug) {
			if (!shape.helper) {
				shape.helper = new THREE.VertexNormalsHelper( shape.mesh, 0.1, 0x00ff00, 10 );
				shape.mesh.add(shape.helper);
			}
		
			shape.helper.update();
		} else {
			if (shape.debugLines) {
				shape.mesh.remove(shape.debugLines); shape.debugLines = null;
			}
		}
	}



	/** Reads a Path from a the SVG Path data.
	 * @returns The resulting PathShape. */
	static readSvgPathData (shape, svgPathData, allAbsolute = false) {
		// switch case
	}


	/** Reads the path from SVG data.
	 * @param svgPathData A string with the SVG path data.
	 * @param params Reading parameters
	 * @returns The path with the SVG data. */
	static readSvgPath (svgPathData, params ) {

		// Check the parameters
		if (!svgPathData) throw new Error("Invalid SVG path data");
		
		let path = params.path || new Path();
		let scale = params.scale || 1;

		// Create an internal function to read float values
		let readFloat = ()=> {
			let value = parseFloat(parts[partIndex++])
			if (scale !== 1) value *= scale;
			return value;
		}

		let point, lastPoint, startPoint;
		let parts = svgPathData.split(' ');
		let partIndex = 0, partCount = parts.length;
		while (partIndex < partCount) {

			let command = parts[partIndex++];
			switch (command) {
				case 'm': case 'M': // Move Point
				// if (partIndex > 1 && !Vector.equals(lastPoint, startPoint)) {
				// 	path.segments.push(new LineSegment({
				// 		pointStart: lastPoint, pointEnd: startPoint
				// 	}));
				// }
				point = new Vector(readFloat(), readFloat());
				startPoint = point;
				break;
				case 'l': case 'L': // Line Segment
				point = new Vector(readFloat(), readFloat());
				path.segments.push(new LineSegment({
					pointStart: lastPoint, pointEnd: point
				}));
				break;
				case 'q': case 'Q': // Quadratic Curve Segment
				point = new Vector(readFloat(), readFloat());
				let controlPoint = new Vector(readFloat(), readFloat());
				path.segments.push(new CurveSegment({
					pointStart: lastPoint, pointEnd: point,
					controlPoints: [controlPoint]
				}));
				break;
			}
			lastPoint = point.clone();
		}

		// Return the path with the SVG data
		return path;
	}


	static drawMove(point){
		ShapeUtils.currentInitialPoint = ShapeUtils.currentPoint = point;
	}

	static drawLine(point){
		ShapeUtils.currentPath.segments.push(new LineSegment({
			pointStart: ShapeUtils.currentPoint, pointEnd: point,
		}));
		ShapeUtils.currentPoint = point;
	}

	static drawCurve(point, controlPoints){
		ShapeUtils.currentPath.segments.push(new CurveSegment({
			pointStart: ShapeUtils.currentPoint, pointEnd: point,
			controlPoints: controlPoints
		}));
		ShapeUtils.currentPoint = point;
	}

	static drawArc(point, center, radius, angleStart, angleEnd){
		
		ShapeUtils.currentPath.segments.push(new ArcSegment({
			pointStart:ShapeUtils.currentPoint, pointEnd:point, center:center,
			radius:radius, angleStart:angleStart, angleEnd:angleEnd
		}));
		
		ShapeUtils.currentPoint = point;
	}



	static convertArc(x0, y0, rx, ry, angleX, largeArcFlag, sweepFlag, x , y) {
	
		// See: SVG Essentials (2nd edition) page 358
		
		// Step 1: compute half the distance between the current
		// and final point.
		var dx2 = (x0 - x) / 2.0; var dy2 = (y0 - y)/2.0;
		
		// convert angle from degrees to radians
		var angleX = Math.PI * (angleX % 360.0) /180.0; 
		var cosXAngle = Math.cos(angleX);
		var sinXAngle = Math.sin(angleX);
		
		// Compute x1, y1
		var x1 = (cosXAngle * dx2 + sinXAngle * dy2);
		var y1 = (-sinXAngle * dx2 + cosXAngle * dy2);
		
		// Ensure radii are large enough
		rx = Math.abs(rx); ry = Math.abs(ry);
		var rxSq = rx * rx; var rySq = ry * ry;
		var x1Sq = x1 * x1; var y1Sq = y1 * y1;
		var radiiCheck = x1Sq / rxSq + y1Sq / rySq;
		if (radiiCheck > 1) {
			rx = Math.sqrt(radiiCheck) * rx;
			ry = Math.sqrt(radiiCheck) * ry;
			rxSq = rx * rx; rySq=ry*ry;
		
		}// Step 2: Compute (cx1, cy1)
		var sign = (largeArcFlag == sweepFlag)? -1 : 1;
		var sq = ((rxSq * rySq) - (rxSq*y1Sq) - (rySq * x1Sq)) /
			((rxSq * y1Sq) + (rySq * x1Sq));
		sq = (sq < 0)? 0: sq;
		var coefficient = (sign * Math.sqrt(sq));
		var cx1 = coefficient * ((rx * y1) / ry);
		var cy1 = coefficient * -((ry * x1) / rx);
		
		// Step 3 : Compute (cx, cy) from (cx1, cy1)
		var sx2 = (x0 + x) / 2.0;
		var sy2 = (y0 + y) / 2.0;
		var cx = sx2 + (cosXAngle * cx1 - sinXAngle * cy1);
		var cy = sy2 + (sinXAngle * cx1 + cosXAngle * cy1);

		// Step 4 : Compute the angleStart and the angleExtent
		var ux = (x1-cx1) / rx;
		var uy = (y1-cy1) / ry;
		var vx = (-x1-cx1) /rx; var vy = (-y1-cy1) / ry;
		
		// Compute the angle start
		var n = Math.sqrt((ux * ux) + (uy * uy));
		var p = ux;// (1 * ux) + (0 * uy)
		sign = (uy < 0)? -1.0 : 1.0;
		var angleStart = 180.0 * (sign * Math.acos(p / n)) / Math.PI;
		
		// Compute the angle extent
		n = Math.sqrt((ux * ux + uy * uy) * (vx * vx + vy * vy));
		p = ux * vx + uy * vy;
		sign = ((ux * vy - uy * vx) <0)? -1.0 : 1.0;
		var angleExtent = 180.0 * (sign * Math.acos(p / n)) / Math.PI;
		if ((!sweepFlag && angleExtent) > 0) { angleExtent -= 360.0; }
		else if (sweepFlag && angleExtent < 0) { angleExtent += 360.0; }
		angleExtent %= 360; angleStart %= 360;
		
		return new ArcSegment({ 
			center: new Vector(cx, cy), radius: new Vector(rx, ry),
			angleStart: angleStart, angleEnd: angleExtent, angleX: angleX
		});
	}
}

ShapeUtils.currentInitialPoint = null;
ShapeUtils.currentPoint = null;
ShapeUtils.currentPath = null;
/** Defines a Invert Modifier. */
class Invert extends Modifier {

	/** Initializes a new Invert instance. 
	 * @param {*} params The creation parameters of the Invert. */
	constructor(params = {}) {

		// Call the base class constructor
		super(params);

		// Set the type of the instance
		this.isInvert = true;
	}

	/** Applies the modifier. */
	apply(parts) {
		console.log("Inverting");
		let partIndex = 0, partCount = parts.length;
		for (partIndex = 0; partIndex < partCount; partIndex++) {
			let part = parts[partIndex], newVertices = [];
			
			let vertexIndex = 0, vertexCount = part.vertices.length / 2;
			for (vertexIndex = vertexCount-1; vertexIndex >= 0; vertexIndex--) {
				let vertexDataIndex = vertexIndex * 2;
				let xA = part.vertices[vertexDataIndex++],
					yA = part.vertices[vertexDataIndex++];
				newVertices.push(xA,yA);
			}
			part.vertices = newVertices;
		}		
	}
}

/** Defines a Skew Modifier. */
class Skew extends Modifier {

	/** Initializes a new Skew instance. 
	 * @param {*} params The creation parameters of the Skew. */
	constructor(params = {}) {

		// Call the base class constructor
		super(params);

		// Set the type of the instance
		this.isWarp = true;

		// Define the properties of the Warp
		this.factor = params.factor || 1;
	}


	/** Applies the modifier. */
	apply(parts) {

		let partIndex = 0, partCount = parts.length;
		for (partIndex = 0; partIndex < partCount; partIndex++) {
			let part = parts[partIndex];
			let vertexIndex = 0, vertexCount = part.vertices.length / 2;
			for (vertexIndex = 0; vertexIndex < vertexCount; vertexIndex++) {
				let vertexDataIndex = vertexIndex * 2;
				part.vertices[vertexDataIndex + 1] +=
					part.vertices[vertexDataIndex + 0] * this.factor;
			}
		}		
		// console.log("Skew");
	}
}

/** Defines a Warp Modifier. */
class Warp extends Modifier {

	/** Initializes a new Warp instance. 
	 * @param {*} params The creation parameters of the Warp. */
	constructor(params = {}) {

		// Call the base class constructor
		super(params);

		// Set the type of the instance
		this.isWarp = true;

		// Define the properties of the Warp
		this.sectors = params.sectors || (360 / Segment.defaultMaxAngle);
		this.factor = params.factor || 360;
		this.offset = params.offset || 0;
	}

	/** Applies the modifier. */
	apply(parts) {

		let sectorWidth = (Math.PI * 2) / this.sectors,
			angleOffset = this.offset * DEG_TO_RAD,
			angleFactor = this.factor * DEG_TO_RAD;


		let partIndex = 0, partCount = parts.length;
		for (partIndex = 0; partIndex < partCount; partIndex++) {
			let part = parts[partIndex], newVertices = [];

			let vertexIndex = 0, vertexCount = part.vertices.length / 2;
			for (vertexIndex = 0; vertexIndex < vertexCount; vertexIndex++) {

				// Calculate the initial point
				let vertexDataIndex = vertexIndex * 2;
				let xA = part.vertices[vertexDataIndex++],
					yA = part.vertices[vertexDataIndex++];

				xA = (xA * angleFactor) + angleOffset;
				let sectorA = Math.floor((xA) / sectorWidth);

				let pa = sectorA * sectorWidth, 
					na = (sectorA + 1) * sectorWidth,
					t = (xA - pa) / (na - pa),
					pX = Math.sin(pa) * yA, pY = Math.cos(pa) * yA,
					nX = Math.sin(na) * yA, nY = Math.cos(na) * yA;
				newVertices.push(pX + t * (nX-pX), pY + t * (nY-pY))

				// Check if we reached the end
				if (vertexIndex == vertexCount -1) {
					if (part.closed) vertexDataIndex = 0
					else break;
				}

				// Calculate the rest of the points of the line
				let xB = part.vertices[vertexDataIndex++],
					yB = part.vertices[vertexDataIndex++];
				xB = (xB * angleFactor) + angleOffset;
				let sectorB = Math.floor((xB) / sectorWidth);
				if (sectorA == sectorB) continue;
				let angle, distance, sameDistance = (yA == yB);
				let i = (sectorA < sectorB)? 1 : -1,
					o = (sectorA < sectorB)? 1 : 0;
				if (sameDistance) distance = yA;
				for (let sector = sectorA; sector !== sectorB; sector += i) {
					let x = (sector + o) * sectorWidth;
					if (!sameDistance) {
						t = (x - xA) / (xB - xA);
						distance = yA + t * (yB - yA)
					}
					angle = x;
					newVertices.push(Math.sin(angle) * distance, 
						Math.cos(angle) * distance);
				}
			}
			part.vertices = newVertices;
		}		
		// console.log("Warping");
	}
}

/** Defines a Circular Path. */
class CirclePath extends Path {

	/** Initializes a new CirclePath instance. 
	 * @param {*} params The creation parameters of the Path. */
	constructor(params = {}) {

		// Call the base class constructor
		super(params);

		// Set the type of the instance
		this.isCirclePath = true;

		// Define the properties of the Path
		this.x = new Parameter("Center X", this, params.x, 0);
		this.y = new Parameter("Center Y", this, params.y, 0);
		this.radius = new Parameter("Radius", this, params.radius, 1);
		this.polygonal = new Parameter("Polygonal", this, 
			params.polygonal, false);
		this.divisions = new Parameter("Divisions", this,
			{ value: params.divisions, minValue: 1}, 4);
		this.circularSectors = new Parameter("Circular Sectors", this, 
			{ value: params.circularSectors, minValue: 4 }, 4);
		this.angleStart = new Parameter("Starting Angle", this, 
			params.angleStart, 0);
		this.angleEnd = new Parameter("Ending Angle", this, 
			params.angleEnd, 360);
		this.pie = new Parameter("Pie Mode", this, params.pie, false);
		this.innerRadius = new Parameter("Inner radius", this, 
			params.innerRadius, 0);

		// Set the path as two-dimensional
		this.dimensions = 2;

		// Update the path
		this.update(true)
	}


	/** Create a copy of the CirclePath. */
	clone() { return new CirclePath(this); }


	/** Updates the CirclePath data.
	* @param {*} forced Indicates whether to force the update or not.
	* @param {*} params Interpolation parameters. */
	update(forced, params = {}) {
		
		// Check if the Path must be updated
		if(this.updated && !forced) return;

		// Reset the segments
		this.segments = [];

		// Check the parameters
		let center = new Vector(this.x.get(), this.y.get()),
			radius = Math.abs(this.radius.get()), 
			polygonal = this.polygonal.get(),
			divisions = this.divisions.get(),
			angleStart = this.angleStart.get() % 360, 
			angleEnd = this.angleEnd.get() % 360,
			closed = (angleStart == angleEnd),
			pie = this.pie.get(), 
			innerRadius = Math.abs(this.innerRadius.get());

		// Make sure the radius is bigger than the inner radius
		if (radius < innerRadius) { 
			radius = innerRadius; innerRadius = Math.abs(this.radius.get());
		}

		// Make sure that the ending angle is bigger than the starting one
		if (angleStart >= angleEnd) angleEnd += 360;

		// Create the list of angles with the initial angle first
		let angles = [angleStart];

		// Calculate the intermediary angles
		if (polygonal) { // Polygonal divisions
			let segmentIndex = 0, segmentCount = divisions,
				angleIncrement = (angleEnd - angleStart) / segmentCount;
			while (segmentIndex < segmentCount) {
				angles.push(angleStart + angleIncrement * ++segmentIndex);
			}
		} else { // Circular sectors

			let sectorAngle = 360 / this.circularSectors.get(),
				sectorStart = parseInt(angleStart/ sectorAngle),
				sectorEnd = parseInt(angleEnd/ sectorAngle),
				sectorIndex = sectorStart;
			
			while (sectorIndex < sectorEnd) {
				angles.push(sectorAngle * ++sectorIndex);
			}
			if (angleEnd !== angles[angles.length-1]) angles.push(angleEnd);
		}



		// Create the segments
		ShapeUtils.currentPath = this;
		let angleIndex, angleCount = angles.length, angle, angleRad, oldAngle;
		for (angleIndex = 0; angleIndex < angleCount; angleIndex++) {
			angle = angles[angleIndex]; angleRad = angle * DEG_TO_RAD;
			let point = new Vector(Math.cos(angleRad) * radius + center.x, 
				Math.sin(angleRad) * radius + center.y);
			if (angleIndex == 0) ShapeUtils.drawMove(point);
			else {
				if (polygonal) ShapeUtils.drawLine(point);
				else ShapeUtils.drawArc(point, center, radius, oldAngle, angle);
			}
			oldAngle = angle;
		}

		// Get the main points of the shape
		let initialPoint = this.segments[0].pointStart,
			finalPoint = this.segments[this.segments.length -1].pointEnd;

		// Check if there is a radius
		if (innerRadius > 0) {
			
			// Draw the inner section
			for (angleIndex = angleCount -1; angleIndex >= 0; angleIndex--) {
				angle = angles[angleIndex]; angleRad = angle * DEG_TO_RAD;
				let point = new Vector(
					Math.cos(angleRad) * innerRadius + center.x, 
					Math.sin(angleRad) * innerRadius + center.y);
				if (angleIndex == angleCount -1) {
					if (closed) ShapeUtils.drawMove(point);
					else ShapeUtils.drawLine(point);
				} else {
					if (polygonal) ShapeUtils.drawLine(point);
					else ShapeUtils.drawArc(point,center,innerRadius,oldAngle,angle);
				}
				oldAngle = angle;
			}

			// Close the shape
			if (!closed)ShapeUtils.drawLine(initialPoint.clone());
		} 
		
		// Check if we have to draw the "pie" segments
		else if (!closed && pie) {
			ShapeUtils.drawLine(center.clone());
			ShapeUtils.drawLine(initialPoint.clone());
		} 

		// Make sure that the shape is properly closed
		else if (closed && !Vector.equals(initialPoint, finalPoint)) {
			finalPoint = initialPoint.clone();
		}

		// Call the base class
		if (!params.justSegments) super.update(forced, params);
	}
}
/** Defines a Rectangular Path. */
class RectanglePath extends Path {

	/** Initializes a new RectanglePath instance. 
	 * @param {*} params The creation parameters of the Path. */
	constructor(params = {}) {

		// Call the base class constructor
		super(params);

		// Define the properties of the Path
		this.isRectanglePath = true;
		this.x = new Parameter("X", this, params.x, 0);
		this.y = new Parameter("Y", this, params.y, 0);
		this.width = new Parameter("Width", this, params.width, 1);
		this.height = new Parameter("Height", this, params.height, 1);
		this.centered = new Parameter("Centered", this, params.centered, false);
		this.rounded = new Parameter("Rounded", this, params.rounded, 0);

		// Set the path as two-dimensional
		this.dimensions = 2;

		// Create the segments of the path
		this.update(true, { justSegments: true })
	}


	/** Create a copy of the RectanglePath. */
	clone() { return new RectanglePath(this); }


	/** Updates the RectanglePath data.
	* @param {*} forced Indicates whether to force the update or not.
	* @param {*} params Interpolation parameters. */
	update(forced, params = {}) {
		
		// Check if the Path must be updated
		if(this.updated && !forced) return;

		// Check the parameters
		let x = this.x.update(), y = this.y.update(),
			w = this.width.update(), h = this.height.update(), 
			r = this.rounded.update(), c = this.centered.update(),
			hw, hh, x0, x1, y0, y1 ;

		// Calculate the positions
		if (w > 0) { x0 = x; x1 = x + w; } else { x0 = x + w; x1 = x; w = -w; }
		if (h > 0) { y0 = y; y1 = y + h; } else { y0 = y + h; y1 = y; h = -h; }
		if (r < 0 ) r = 0 ; 
		hw = w / 2; hh = h / 2; if (r > hw) r = hw; if (r > hh) r = hh;
		if (c) { x0 -= hw; x1 -= hw; y0 -= hh; y1 -= hh; }

		// Create the segments
		this.segments = [];
		if (w !== 0 || h !== 0) {
			ShapeUtils.currentPath = this;
			if (r > 0) {
				let rV = new Vector(r, r);
				ShapeUtils.drawMove(new Vector(x0+r, y0));
				ShapeUtils.drawLine(new Vector(x1-r, y0));
				ShapeUtils.drawArc(new Vector(x1, y0+r), 
					new Vector(x1-r, y0+r), rV, 270, 360);
				ShapeUtils.drawLine(new Vector(x1, y1-r));
				ShapeUtils.drawArc(new Vector(x1-r, y1), 
					new Vector(x1-r, y1-r), rV, 0, 90);
				ShapeUtils.drawLine(new Vector(x0+r, y1));
				ShapeUtils.drawArc(new Vector(x0, y1-r), 
					new Vector(x0+r, y1-r), rV, 90, 180);
				ShapeUtils.drawLine(new Vector(x0, y0+r));
				ShapeUtils.drawArc(new Vector(x0+r, y0), 
					new Vector(x0+r, y0+r), rV, 180, 270);
			} else {
				ShapeUtils.drawMove(new Vector(x0, y0));
				ShapeUtils.drawLine(new Vector(x1, y0));
				ShapeUtils.drawLine(new Vector(x1, y1));
				ShapeUtils.drawLine(new Vector(x0, y1));
				ShapeUtils.drawLine(new Vector(x0, y0));
			}
		}

		// Call the base class
		if (!params.justSegments) super.update(forced, params);
	}
}
/** Defines a Arc Segment. */
class ArcSegment extends Segment {

	/** Initializes a new ArcSegment Instance.
	 * @param {*} params The creation parameters of the Segment. */
	constructor(params = {}) { 
		
		// Call the parent class constructor
		super(params);

		// Define the fields
		this.isArcSegment = true;
		this.center = params.center || new Vector(1,1);
		this.radius = params.radius || new Vector(1,1);
		this.angleStart = params.angleStart || 0;
		this.angleEnd = params.angleEnd || 0;
		this.angleX = params.angleX || 0;

		// If the radius is an number, make it into a Vector
		if (!this.radius.isVector) {
			this.radius = new Vector(this.radius, this.radius);
		}
	}


	/** Create a copy of the Segment. */
	clone() { return new ArcSegment(this); }


	/** Updates the Segment data.
	* @param {*} forced Indicates whether to force the update or not.
	* @param {*} params Interpolation parameters. */
	update(forced = false, params = {}) {

		// Check if the Segment must be updated
		if(this.updated && !forced) return;

		// Check the dimensions of the points
		if (params.dimensions) this.dimensions = params.dimensions;
		else {
			this.dimensions = 2;
			if (this.dimensions < this.pointStart.dimensions)
				this.dimensions = this.pointStart.dimensions;
			if (this.dimensions < this.pointEnd.dimensions)
				this.dimensions = this.pointEnd.dimensions;
		}

		// Clear the vertex data and add the first point values
		this.vertices = this.pointStart.get();

		// Calculate the interpolated points by using circular sector
		const cx = this.center.x, cy = this.center.y,
			rx = this.radius.x, ry = this.radius.y,
			angleStart = this.angleStart, angleEnd = this.angleEnd,
			sectorAngle = (params.maxAngle || Segment.defaultMaxAngle),
			sectorStart = parseInt(angleStart / sectorAngle),
			sectorEnd = parseInt(angleEnd / sectorAngle);

		// Only create the interpolated points, if we have multiple sectors
		if (sectorStart !== sectorEnd) {

			// Calculate the angles, sector by sector
			let angles = [], sector = sectorStart;
			if (sectorStart < sectorEnd) {
				while (sector < sectorEnd) angles.push(sectorAngle * ++sector);
			} else {
				while (sector > sectorEnd) angles.push(sectorAngle * sector--);
			}

			// Create the vertex data
			let angle, angleIndex = 0, angleCount = angles.length;
			for (angleIndex = 0; angleIndex < angleCount; angleIndex++) {
				angle = angles[angleIndex];
				if (angle == angleStart || angle == angleEnd) continue;
				angle *= DEG_TO_RAD;
				this.vertices.push(cx + Math.cos(angle) * rx);
				this.vertices.push(cy + Math.sin(angle) * ry);
				for (let d = 2; d < this.dimensions; d++) this.vertices.push(0);
			} 
		}

		// Add the final point values (unless specifically requested otherwise)
		if (!(params.skipLastPoint)) {
			this.vertices.pushArray(this.pointEnd.values);
		}

		// Mark the segment as updated
		this.updated = true;

		// Return the vertex data
		return this.vertices;
	}
}

/** Defines a Curve Segment. */
class CurveSegment extends Segment {

	/** Initializes a new CurveSegment Instance.
	 * @param {*} params The creation parameters of the Segment. */
	constructor(params = {}) { 
		
		// Call the parent class constructor
		super(params);

		// Define the fields
		this.isCurveSegment = true;
		this.controlPoints = params.controlPoints || [];
	}


	/** Create a copy of the Segment. */
	clone() { return new CurveSegment(this); }


	/** Updates the Segment data.
	* @param {*} forced Indicates whether to force the update or not.
	* @param {*} params Interpolation parameters. */
	update(forced = false, params = {}) {
	
		// Check if the Segment must be updated
		if(this.updated && !forced) return;

		// Initialize the list of points
		this.points = [];
		this.points.push(this.pointStart);
		this.points.pushArray(this.controlPoints);
		this.points.push(this.pointEnd);

		// Check that we have enough points to begin with
		let pointCount = this.points.length;
		if (pointCount < 3) throw new Error ("Not enough number of points");

		// Check the dimensions of the points
		if (params.dimensions) this.dimensions = params.dimensions;
		else { // Check the dimensions of the points
			this.dimensions = 2;
			for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
				if (this.points[pointIndex].dimensions == 3) { 
					this.dimensions=3; break; 
				}	
			}
		}

		// Clear the vertex data and add the first point values
		this.vertices = (this.pointStart.get())
		
		// Use the De Casteljau's algorithm to interpolate the segment
		// See: https://en.wikipedia.org/wiki/De_Casteljau's_algorithm
		if (pointCount > 2) {

			//Store the data of all the points into an array
			let pointData = [], tempData = [];
			for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
				const point = this.points[pointIndex];
				pointData.push(point.x, point.y);
				if (this.dimensions > 2) pointData.push(point.z);
			}

			// Start interpolating, step by step
			let stepIndex, stepValue, 
				stepCount = params.steps || Segment.defaultSteps, 
				dimIndex, dimCount = this.dimensions, 
				level, partIndex, dataIndex, v0, v1;
			for (stepIndex = 0; stepIndex < stepCount; stepIndex++) {

				// Calculate the current stepValue and its inverse
				stepValue = (stepIndex + 1) / (stepCount + 1);

				// Go though each level of the inverse triangle
				for (level = pointCount - 1; level > 0; level--) {

					// If it's the initial level, get data from the point data
					let data = (level == pointCount-1)? pointData : tempData;

					// Interpolate each subsegment and each dimension
					for (partIndex = 0; partIndex < level; partIndex++) {
						for (dimIndex = 0; dimIndex < dimCount; dimIndex++) {
							dataIndex = (partIndex * dimCount) + dimIndex;
							v0 = data[dataIndex], v1 = data[dataIndex+dimCount];
							tempData[dataIndex] = v0 + ((v1 - v0) * stepValue);
						}
					}
				}

				// Copy the resulting values for this step
				for (let dimIndex = 0; dimIndex < dimCount; dimIndex++) {
					this.vertices.push(tempData[dimIndex]);
				}
			}
		}

		// Add the final point values (unless specifically requested otherwise)
		if (!(params.skipLastPoint)) {
			this.vertices.pushArray(this.pointEnd.values);
		}

		// Mark the segment as updated
		this.updated = true;

		// Return the vertex data
		return this.vertices;
	}
}
/** Defines a Line Segment. */
class LineSegment extends Segment {

	/** Initializes a new LineSegment Instance.
	 * @param {*} params The creation parameters of the Path. */
	constructor(params = {}) { 
		
		// Call the parent class constructor
		super(params);

		// Define the fields
		this.isLineSegment = true;
	}


	/** Create a copy of the LineSegment Instance. */
	clone() { return new LineSegment(this); }
	

	/** Updates the Segment data.
	* @param {*} forced Indicates whether to force the update or not.
	* @param {*} params Interpolation parameters. */
	update(forced = false, params = {}) {
	
		// Check if the Segment must be updated
		if(this.updated && !forced) return;

		// Check the dimensions of the points
		if (params.dimensions) this.dimensions = params.dimensions;
		else {
			this.dimensions = 2;
			if (this.dimensions < this.pointStart.dimensions)
				this.dimensions = this.pointStart.dimensions;
			if (this.dimensions < this.pointEnd.dimensions)
				this.dimensions = this.pointEnd.dimensions;
		}

		// Clear the vertex data and add the first point values
		this.vertices = this.pointStart.get(this.dimensions);

		// Add the final point values (unless specifically requested otherwise)
		if (!(params.skipLastPoint)) {
			this.vertices.pushArray(this.pointEnd.get(this.dimensions));
		}

		// Mark the segment as updated
		this.updated = true;

		// Return the generated array of vertex data
		return this.vertices;
	}
}

/** Defines a Box Shape */
class Box extends Shape {

	/** Initializes a new Box Instance.
	 * @param {*} name The name of the Box.
	 * @param {*} params The creation parameters of the Box. */
	constructor(name, parent, params = {}) {

		// Call the base class constructor
		super(name || '[Box]', parent, params);

		// Set the type of the instance
		this.isBox = true;

		// Define the properties of the Box
		this.x = new Parameter("Z", this, params.x, 0);
		this.y = new Parameter("Y", this, params.y, 0);
		this.z = new Parameter("Z", this, params.z, 0);
		this.width = new Parameter("Width", this, params.width, 1);
		this.height = new Parameter("Height", this, params.height,1);
		this.depth = new Parameter("Depth", this, params.depth, 1);
		this.centered = new Parameter("Centered", this, params.pie, false);
	}


	/** Updates the Box data.
	* @param {*} forced Indicates whether to force the update or not.*/
	update() {

		// Check if the Box must be updated
		if (this.updated) return;

		// Create a rectangular shape with the current parameters
		let base = new RectanglePath( {
			x: this.x.get(),
			y: this.y.get(),
			width: this.width.get(),
			height: this.depth.get(),
			centered: this.centered.get(),
			modifiers: this.modifiers
		});

		// Extrude the shape to generate the geometry
		ShapeUtils.extrude(this, base, this.height.get());
		
		// Call the base class
		super.update();

		// Show a message on console
		// console.log("Box Updated: " + this.name);
	}
}
/** Defines a Cylindrical Shape */
class Cylinder extends Shape {

		/** Initializes a new Shape Instance.
	 * @param {*} name The name of the Shape.
	 * @param {*} params The creation parameters of the Shape. */
	constructor(name, parent, params = {}) {

		// Call the base class constructor
		super(name || '[Cylinder]', parent, params);

		// Set the type of the instance
		this.isCylinder = true;

		// Define the properties of the Shape
		this.x = new Parameter("Z", this, params.x, 0);
		this.y = new Parameter("Y", this, params.y, 0);
		this.z = new Parameter("Z", this, params.z, 0)
		this.radius = new Parameter("Radius", this,
			{value: params.radius, minValue: 0}, 1);
		this.height = new Parameter("Height", this,
			{value: (params.height == 0)? 0 : (params.height||1), minValue: 0});
		this.polygonal = new Parameter("Polygonal", this, 
			params.polygonal || false);
		this.divisions = new Parameter("Divisions", this,
			{ value: params.divisions || 12, minValue: 1});
		this.circularSectors = new Parameter("Circular Sectors", this, 
			{ value: params.circularSectors || 4, minValue: 4 });
		this.angleStart = new Parameter("Starting Angle", this, 
			(params.angleStart == 0)? 0 : (params.angleStart || 360));
		this.angleEnd = new Parameter("Ending Angle", this, 
			(params.angleEnd == 0)? 0 : (params.angleEnd || 360));
		this.pie = new Parameter("Pie Mode", this, params.pie || false);
		this.innerRadius = new Parameter("Inner radius", this, 
			params.innerRadius || 0);
	}


	/** Updates the Shape data.
	* @param {*} forced Indicates whether to force the update or not.*/
	update() {

		// Check if the Cylinder must be updated
		if (this.updated) return;

		// Create a circular shape with the current parameters
		let base = new CirclePath( {
			radius: this.radius.get(),
			polygonal: this.polygonal.get(),
			divisions: this.divisions.get(),
			circularSectors: this.circularSectors.get(),
			angleStart: this.angleStart.get(),
			angleEnd: this.angleEnd.get(),
			pie: this.pie.get(),
			innerRadius: this.innerRadius.get(),
		});

		// Extrude the shape to generate the geometry
		ShapeUtils.extrude(this, base, this.height.get());
		
		// Call the base class
		super.update();

		// Show a message on console
		// console.log("Cylinder Updated: " + this.name);
	}
}
/** Defines a Text Shape */
class Text extends Shape {

	/** Initializes a new Text Instance.
	 * @param {*} name The name of the Text.
	 * @param {*} params The creation parameters of the Text. */
	constructor(name, parent, params = {}) {

		// Call the base class constructor
		super(name || '[Text]', parent, params);

		// Set the type of the instance
		this.isText = true;

		// Define the properties of the Text
		this.text = new Parameter("text", this, params.text, 0);
		this.x = new Parameter("Z", this, params.x, 0);
		this.y = new Parameter("Y", this, params.y, 0);
		this.z = new Parameter("Z", this, params.z, 0);
		this.font = new Parameter("Font", this, params.font, 1);
		this.depth = new Parameter("Depth", this, params.depth, 0.1);
		this.alignX = new Parameter("X Alignment", this, params.alignX, 0);
		this.alignY = new Parameter("Y Alignment", this, params.alignY, 0.5);
		this.alignZ = new Parameter("Z Alignment", this, params.alignZ, 0);
		this.size = new Parameter("Size", this, params.size, 1);
		this.alignLine = new Parameter("Line Alignment", this, params.alignLine, 0.5);
		this.numberDigits =new Parameter("Number Digits", this, params.numberDigits, 2);
	}


	/** Updates the Text data.
	* @param {*} forced Indicates whether to force the update or not.*/
	update() {

		// Check if the Text must be updated
		if (this.updated) return;

		// Check if the font is loaded
		let font = Font.instances[this.font.get()];
		if (!font.loaded) return;

		// Get the text string
		let text = this.text.get();
		if (Number.isFinite(text)) text = text.toFixed(this.numberDigits.get());
		

		// Create the variables to handle per-line alignment
		let lineIndex = 0, lineWidths = [], lineHeight = font.lineHeight;

		// Calculate the bounding box
		let x = 0, y = 0, z = 0, w = 0, h = 0, s = this.size.get(), d = this.depth.get();
		let charIndex, charCount = text.length;
		for (charIndex = 0; charIndex < charCount; charIndex++) {
			let char = text[charIndex];
			if (char == '\n') { 
				lineIndex++; lineWidths.push(x);
				x = 0; h -= lineHeight; continue;
			}
			let glyph = font.glyphs[char];
			if (!glyph) continue;
			x += glyph.ha;
			if (w < x) w = x;
		}
		lineWidths.push(x); h += lineHeight + font.descender;

		// Align the text properly
		x = -w * this.alignX.get();
		y = -h * this.alignY.get();
		z = -d * this.alignZ.get();

		lineIndex = 0;
		let x0 = w * this.alignX.get();
		x = x0 + (-lineWidths[lineIndex] * this.alignLine.get());

		// Create a rectangular shape with the current parameters
		let base = new Path(); 
		for (charIndex = 0; charIndex < charCount; charIndex++) {
			let char = text[charIndex];
			if (char == '\n') { 
				x = x0 + (-lineWidths[++lineIndex] * this.alignLine.get());
				y -= lineHeight; continue;
			}
			let glyph = font.glyphs[char];
			if (!glyph) continue;
			base.join(glyph.path, new Vector(x, y, z), null, new Vector(s, s, 1));
			x += glyph.ha;
		}

		// Extrude the shape to generate the geometry
		ShapeUtils.extrude(this, base, this.depth.get());
		
		// Call the base class
		super.update();

		// Show a message on console
		// console.log("Text Updated: " + this.name);
	}
}
/** Defines an Interaction Controller */
class Controller {

	/** Initializes a new Controller Instance.
	 * @param layer The Layer associated to the Controller.
	 * @param {*} params The creation parameters of the Controller. */
	constructor (layer, params = {}) {

		// Store the type of the class
		this.isController = true;

		// Store Layer associated to the Controller.
		this.layer = layer;

		// Mark the 
		this.updated = false;
	}
}
/** Defines an Entity of the Interaction Space. */
class Entity {

	/** Initializes a new Entity Instance.
	 * @param name The name of the Entity.
	 * @param parent The parent of the Entity.
	 * @param {*} params The creation parameters of the Entity. */
	constructor(name, parent, params = {}) {

		// Check the name and the parent
		if (!name) throw Error ("Undefined Entity name");
		// if (!parent) throw Error ("Undefined Entity parent");
		this.name = new Parameter("Name", this, {value: name});
		this.parent = new Parameter("Parent", this, {value: parent});

		// Set the type of the instance
		this.isEntity = true;
		
		// Define a variable to indicate if its updated
		this.updated = false;

		// The representation of the entity
		this.representation = params.representation || undefined;

		// Set the transform vectors
		this.position = params.position || new Vector(0,0,0);
		this.rotation = params.rotation || new Vector(0,0,0);
		this.position.parent = this; this.rotation.parent = this;

		this.entities = [];

		// It is important to add the parent, to ensure a proper connection
		if (parent) {
			if (parent.entities) parent.entities.push(this);
			if (parent.representation && this.representation) 
				parent.representation.add(this.representation);
		}
	}

	/** Downdates the Entity. */
	downdate() { 

		// Mark the ValuePoint as downdated
		this.updated = false;

		// Downdate the parent (or mark it as "not updated")
		if(this.parent.downdate) this.parent.downdate();
		else if(this.parent.updated) this.parent.updated = false;
	}

	/** Updates the Entity. */
	update() {

		// Make sure that the Entity is *not* updated
		if (this.updated) return;

		// Check the representation
		let representation = this.representation;
		if (representation) {

			// Apply the transformations
			let p = this.position, r = this.rotation;
			if (!p.updated) { p.update(); 
				this.representation.position.set(p.x, p.y, p.z); 
			}
			if (!r.updated) { r.update(); 
				this.representation.setRotationFromEuler(new THREE.Euler(
					r.x * DEG_TO_RAD, r.y * DEG_TO_RAD, r.z * DEG_TO_RAD));
			}

			if (!this.name.updated) representation.name = this.name.get();

			// Check the parent reference and its representation
			if (!this.parent.updated) {

				let parent = this.parent.update();

				if (parent && parent.entities) parent.entities.push(this);

				if (parent && parent.representation !== representation.parent) {
					parent.representation.add(representation);
				}
			}
		}
		else { this.name.updated = this.parent.updated = false; }	

		// Update the child entities
		this.entities.forEach(entity => { entity.update(); });

		// Mark the Entity as updated
		if (representation) this.updated = true; 

		// Show a message on console
		// console.log("Entity Updated: " + this.name);
	}

	/** Deletes the Entity. */
	delete() {

		// Check the representation
		let representation = this.representation;
		if (!representation) return;
		
		// Remove the representation from the hierarchy
		let parent = this.parent.get();
		if (parent && parent.representation == representation.parent) {
			parent.representation.remove(representation);
		}
	}
}
/** Defines an interaction Layer. */
class Layer {

	/** Initializes a new Layer Instance.
	 * @param name The name of the Layer.
	 * @param app The app the Layer belongs to.
	 * @param {*} params The creation parameters of the Layer. */
	constructor(name, app, params ={}) {

		// Store the type of the class
		this.isLayer = true;

		// Check the name parameter
		this.name = name = name || "Layer" + app.layers.length;

		// Check the parent parameter
		if (!app || !app.isApp) throw new Error(
			"Invalid App for Layer '" + this.name + "'");
		this.app = app; this.app.layers.push(this);

		// Define a variable to indicate if its updated
		this.updated = false;

		// Check the creation parameters
		this.diegetic = params.diegetic || false;

		// Get the space associated to the layer (or create a new one)
		this.space = params.space || new Space(this.name + "Space", app);

		// Create the list of widgets
		this.widgets = [];

		// Create the camera Widget
		this.camera = new Camera(this.name+"Camera");

		this.camera.position.setZ(-10);

		// this.cameraViewRect = new RectangleShape({width:17, height:2, centered: true})
		// this.cameraView = new ShapeViewer("cameraView", this, {shape: this.cameraViewRect });
		// this.size = new Vector(1,1,0);
	}


	/** Updates the Layer. */
	update() {

		
		if (this.controller) this.controller.update();

		this.space.update(); this.representation = this.space.representation;

		// Update the camera
		this.camera.update();

		// Update the widgets
		this.widgets.forEach(widget => { widget.update(); });

		// Render the layer
		this.app.renderer.render(this.space.representation, this.camera.representation);

		// Mark the layer as updated
		this.updated = true; 

		// Show a message on console
		// console.log("Layer '" + this.name + "' updated");
	}


	/** Resizes the Layer Instance. 
	 * @param aspectRatio The new aspect ratio. */
	resize(aspectRatio) { 
		this.camera.aspect.set(aspectRatio);
	}


	/** */
	
}
/** Defines an Interaction Space. */
class Space {
	
	/** Initializes a new Space Instance.
	 * @param name The name of the Space.
	 * @param {*} params The creation parameters of the Space. */
	constructor(name, params = {}) {
		
		// Store the type of the instance
		this.isSpace = true;

		// Check the name
		this.name = name || "Space";

		// Create the representation of the Space
		this.representation = new THREE.Scene();

		// The child entities
		this.entities = [];

		// Adds the generator to the global list
		Space.instances.push(this);
	}


	/** Updates the Space. */
	update() {

		// Update the child entities
		let entityIndex = 0, entityCount = this.entities.length;
		for (entityIndex = 0; entityIndex < entityCount; entityIndex++) {
			this.entities[entityIndex].update();
		}
	}
	
}

/** The global list of Interaction Spaces. */
Space.instances = [];
/** Defines an Interaction Widget (a control element). */
class Widget {

	/** Initializes a new Widget Instance.
	 * @param name The name of the Widget.
	 * @param parent The parent of the Widget.
	 * @param {*} params The creation parameters of the Widget. */
	constructor(name, parent, params = {}) {

		// Check the name parameter
		this.name = name = name || "Widget";

		// Check the parent parameter (it can be layer or another widget)
		if (!parent) throw new Error("Invalid parent for Widget: " + this.name);
		this.parent = parent;

		// Set the type of the instance
		this.isWidget = true;

		// Check if the name is repeated in the parent and add it
		let widgetList = (parent.isWidget)? parent.children: parent.widgets;
		let copyNameIndex = 1;
		while (widgetList.includes(this.name)) this.name = name+copyNameIndex++;
		widgetList.push(this);

		// Set the transform vectors
		this.position = params.position || new Vector(0,0,0);
		this.rotation = params.rotation || new Vector(0,0,0);
		this.scale = params.scale || new Vector(1,1,1);
		this.size = params.size || new Vector(1,1,1);

		this.position.parent = this;
		this.rotation.parent = this;
		this.scale.parent = this;
		this.size.parent = this;

		// Create the representation and make it a child of its parent
		this.representation = new THREE.Object3D();
		this.representation.name = this.name;
		if (this.parent.isWidget) { 
			this.parent.representation.add(this.representation); 
		} else this.parent.space.representation.add(this.representation);

		// let test = new THREE.Mesh( new THREE.BoxBufferGeometry(1,1,1),
		// 	new THREE.MeshLambertMaterial());
		// this.representation.add(test);

		// Create the properties of the widget
		this.children = [];

		// Create the entities associated to the widget
		this.entities = [];

	}


	/** Creates a copy of the Widget.
	 * @param {*} newName The new name of the Widget.
	 * @param {*} newParent The new name of the Widget. */
	clone(newName, newParent) {
		return new Widget((newName)? newName : this.name, 
			newParent? newParent: this.parent, this);
	}


	/** Downdates the Widget. */
	downdate() { 
		// Make sure that the Widget is *already* updated
		if (!this.updated || this.parent == null) return;

		// Mark the widget as downdated
		this.updated = false; 

		// Downdate the parent
		if (this.parent && this.parent.downdate) this.parent.downdate();
	}


	/** Updates the Widget. */
	update() { 

		// Make sure that the Widget is *not* updated
		if (this.updated) return;

		// Apply the transformations
		let p = this.position, r = this.rotation, s = this.scale;
		if(!p.updated) { p.update();
			this.representation.position.set(p.x, p.y, p.z);
		}
		if(!r.updated) { r.update();
			this.representation.rotation.set(r.x * DEG_TO_RAD, 
			r.y * DEG_TO_RAD, r.z * DEG_TO_RAD);
		}
		if(!s.updated) { s.update(); 
			 this.representation.scale.set(s.x, s.y, s.z); }

		// Update the children
		let childIndex = 0, childCount = this.children.length;
		for (childIndex = 0; childIndex < childCount; childIndex++) {
			this.children[childIndex].update();
		}
		
		// Update the entities
		let entityIndex = 0, entityCount = this.entities.length;
		for (entityIndex = 0; entityIndex < entityCount; entityIndex++) {
			this.entities[entityIndex].update();
		}

		// Mark the widget as updated
		this.updated = true; 

		// Show a message on console
		// console.log("Widget Updated: " + this.name);
	}

}
/** Defines a Camera Controller. */
class CameraController extends Controller {

	/** Initializes a new CameraController Instance.
	 * @param layer The Layer associated to the Controller.
	 * @param {*} params The creation parameters of the Controller. */
	constructor (layer, params ={}) {

		// Call the parent class constructor
		super(layer, params);

		// Store the type of the class
		this.isThirdPersonController = true;

		// Define the parameters of the controller
		this.yaw = new Parameter("Yaw (Horizontal angle)", this, params.yaw);
		this.pitch = new Parameter("Pitch (Vertical Angle)", this,params.pitch);
		this.distance = new Parameter("Distance", this, params.distance, 20);
		this.speed = new Parameter("Rotation Speed", this, params.speed, 0.1)
		this.zoom = new Parameter("Zoom Speed", this, params.zoom, 0.01);

		this.touch = new Parameter("Touch Enabled", this, params.touch, true);
		this.mouse = new Parameter("Mouse Enabled", this, params.mouse, true);

		document.addEventListener('mousedown', this.startOrbit.bind(this), false);
		document.addEventListener('mousemove', this.updateOrbit.bind(this), false);
		document.addEventListener('wheel', this.updateOrbit.bind(this), false);
		document.addEventListener('mouseup', this.endOrbit.bind(this), false);
	
		document.addEventListener('touchstart', this.startOrbit.bind(this), false);
		document.addEventListener('touchmove', this.updateOrbit.bind(this), false);
		document.addEventListener('touchend', this.endOrbit.bind(this), false);
	}

	startOrbit(event) {
		// If its a touch event, use the first touch as the event
		if (event.type == "touchstart") event = event.touches[0];
		this.dragCursor = new Vector(event.pageX, event.pageY);
		this.dragYaw = this.yaw.get(); this.dragPitch = this.pitch.get();
		this.touchSeparation = null;
	}

	updateOrbit(event) {

		// Get the current values
		let distance = this.distance.get(),
			yaw = this.yaw.get(),
			pitch = this.pitch.get(),
			speed = this.speed.get(),
			zoom = this.zoom.get(),
			rotating = false,
			x = 0, y = 0, zoomDelta = 0;

		// Check if it is a touch event
		if (this.touch.get() && event.type == "touchmove") {

			// Store the data of the touches
			let touches = event.touches, touchCount = touches.length;

			switch (touchCount) {
				case 1: 
					rotating = true;
					x = touches[0].pageX; y = touches[0].pageY; 
					break;
				case 2: 
					// Disable the drag operation
					this.dragCursor = null

					// Calculate the zoom by separation
					let t0 = touches[0], t1 = touches[1],
						p0X = t0.pageX, p0Y = t0.pageY,
						p1X = t1.pageX, p1Y = t1.pageY,
						pX = p0X - p1X, pY = p0Y - p1Y,
						separation = Math.sqrt(((pX * pX) + (pY * pY)));

					if (this.touchSeparation) {
						zoomDelta = (this.touchSeparation - separation) * 0.4;
					} 
					this.touchSeparation = separation;
					break;
			}
		}

		// Check if it is a mouse event
		if (this.mouse.get()){
			switch (event.type) {
				case "mousemove": 
					rotating = (event.buttons == 1);
					x = event.pageX; y = event.pageY; 
				break;
				case "wheel": 
				zoomDelta = event.deltaY;
				break;
			}
		}

		// Check if the user is rotating the camera
		if (rotating == true && this.dragCursor) {
			yaw = (x - this.dragCursor.x) * -speed + this.dragYaw;
			pitch = (y - this.dragCursor.y) * speed + this.dragPitch;
			this.yaw.set(yaw); this.pitch.set(pitch);
		}
		
		// Check if the user is  the camera
		if (zoomDelta) {
			distance += zoomDelta * zoom;
			this.distance.set(distance);
		}
	}

	endOrbit(e) {
		this.dragCursor = null;
	}

	
	/** Updates the Controller. */
	update() {

		// Make sure that the Camera is *not* updated
		if (this.updated) return;

		let distance = this.distance.get(),
			yaw = this.yaw.get(), yawRad = yaw * DEG_TO_RAD,
			pitch = this.pitch.get(), pitchRad = pitch * DEG_TO_RAD;

		let x = Math.sin(yawRad) * distance,
			y = Math.cos(yawRad) * Math.sin(pitchRad) * distance,
			z = Math.cos(yawRad) * Math.cos(pitchRad) * distance;

		// Update the camera
		let camera = this.layer.camera;
		camera.position.setX(x);
		camera.position.setY(y);
		camera.position.setZ(z);
		camera.rotation.setY(yaw);
		camera.rotation.setX(-pitch);
		camera.updated = false;

		// Mark the controller as updated
		this.updated = true; 

		// Show a message on console
		// console.log("ThirdPersonController Updated: "
		// 	+ yaw.toFixed(2) + ", " + pitch.toFixed(2) + " " 
		// 	// + camera.position.toString()
		// 	);
	}
}
/** Defines a Camera Entity. */
class Camera extends Entity {

	/** Initializes a new Camera Instance.
	 * @param name The name of the Camera.
	 * @param parent The parent of the Camera.
	 * @param {*} params The creation parameters of the Camera. */
	constructor(name, parent, params = {}) {

		// Call the parent class constructor
		super(name, parent, params);

		// Set the type of the instance
		this.isCamera = true;

		// Create the Camera parameters
		this.type = new Parameter("type", this, params.type || 'perspective');
		this.fov = new Parameter("fov", this, params.fov || 45);
		this.aspect = new Parameter("aspect", this, params.aspect || 1);
		this.width = new Parameter("width", this, params.width || 1);
		this.height = new Parameter("height", this, params.height || 1);
		this.near = new Parameter("near", this, params.near || 0.1);
		this.far = new Parameter("far", this, params.far || 2000);
	}


	/** Updates the Camera. */
	update() {

		// Make sure that the Camera is *not* updated
		if (this.updated) return;

		// Get the representation of the Camera
		let camera = this.representation;

		// Check if we have to update the entity
		switch (this.type.get()) {
			case 'perspective':
				if (!camera || !camera.isPerspectiveCamera) {
					camera =this.representation =new THREE.PerspectiveCamera();
				}
				camera.fov = this.fov.get();
				camera.aspect = this.aspect.get();
				camera.near = this.near.get();
				camera.far = this.far.get();
				break;
			case 'orthographic':
				if (!camera || !camera.isOrthographicCamera) {
					camera =this.representation =new THREE.OrthographicCamera();
				}
				camera.left = this.width.get() / -2.0;
				camera.right = this.width.get() / 2.0;
				camera.top = this.top.get() / 2.0;
				camera.bottom = this.bottom.get() / -2.0;
				camera.near = this.near.get();
				camera.far = this.far.get();
				break;
			default: throw new Error("Invalid camera type: " + this.type.get());
		}

		// Call the parent class
		super.update();

		// Update the projection matrix
		camera.updateProjectionMatrix();

		// Show a message on console
		// console.log("Camera Updated: " + this.name.get() + " "
		// 	+ this.position + " " + this.rotation );
	}
}

/** Defines a Geometry Entity. */
class Geometry extends Entity {

	/** Initializes a new Geometry Instance.
	 * @param name The name of the Entity.
	 * @param parent The parent of the Entity.
	 * @param {*} params The creation parameters of the Entity. */
	constructor(name, parent, params = {}) {

		// Call the parent class constructor
		super(name, parent, params);

		// Set the type of the instance
		this.isGeometry = true;

		// Check the creation parameters
		this.debug = params.debug || false;
		this.color = params.color || new Color(1,1,1,1);
		this.materialType = new Parameter("MaterialType", this,
			params.materialType || 'basic');
		this.materialWireframe = params.materialWireframe || true;

		// Add the scale property
		this.scale = params.scale || new Vector(1, 1, 1);
		this.scale.parent = this; 

		// The geometric Shape
		this.shape = new Parameter("Shape", this, {value: params.shape});
		this.shape.parent = this;
		// TODO fuse multiple shapes?
	}


	/** Updates the Mesh. */
	update() {

		// Make sure that the Camera is *not* updated
		if (this.updated) return;

		// Update the Shape
		let shape = this.shape.get();
		if (shape && !shape.updated) {
			shape.parent = this;
			shape.update();
			if (shape && shape.mesh) this.representation = shape.mesh;
		}

		// Call the parent class
		super.update();

		if (!shape.updated) this.updated = false;
		// this.updated = false;

		// Show a message on console
		// console.log("Geometry Updated: " + this.name.get() + " "
		// 	+ this.position + " " + this.rotation );
	}
}

/** Defines a Light Entity. */
class Light extends Entity {

	/** Initializes a new Light Instance.
	 * @param name The name of the Light.
	 * @param parent The parent of the Light.
	 * @param {*} params The creation parameters of the Light. */
	constructor(name, parent, params = {}) {

		// Call the parent class constructor
		super(name, parent, params);

		// Set the type of the instance
		this.isLight = true;

		// Create the Light parameters
		this.type = new Parameter("type", this, params.type || 'directional');
		this.color = new Parameter("color", this, params.color || 0xFFFFFF);
		this.intensity = new Parameter("intensity", this, params.intensity || 1);
		this.distance = new Parameter("distance", this, params.distance || 0);
		this.decay = new Parameter("decay", this, params.decay || 1);
		this.angle = new Parameter("angle", this, params.angle || Math.PI/3);
		this.penumbra = new Parameter("penumbra", this, params.penumbra || 0);
	}


	/** Updates the Light. */
	update() {

		// Make sure that the Light is *not* updated
		if (this.updated) return;

		// Get the representation of the Light
		let light = this.representation;

		// Check if we have to update the entity
		switch (this.type.get()) {
			case 'ambient':
				if (!light || !light.isAmbientLight) {
					light = this.representation = new THREE.AmbientLight();
				}
				light.color = new THREE.Color(this.color.get());
				light.intensity = this.intensity.get();
				break;
			case 'point':
				if (!light || !light.isPointLight) {
					light = this.representation = new THREE.PointLight();
				}
				light.color = new THREE.Color(this.color.get());
				light.intensity = this.intensity.get();
				light.distance = this.distance.get();
				light.decay = this.decay.get();
				break;
			case 'spot':
				if (!light || !light.isSpotLight) {
					light = this.representation = new THREE.SpotLight();
				}
				light.color = new THREE.Color(this.color.get());
				light.intensity = this.intensity.get();
				light.distance = this.distance.get();
				light.decay = this.decay.get();
				light.angle = this.angle.get();
				light.penumbra = this.penumbra.get();
				break;
			case 'directional':
				if (!light || !light.isDirectionalLight) {
					light = this.representation = new THREE.DirectionalLight();
				}
				light.color = new THREE.Color(this.color.get());
				light.intensity = this.intensity.get();
				break;
			case 'hemisphere':
				if (!light || !light.isHemisphereLight) {
					light = this.representation = new THREE.HemisphereLight();
				}
				light.color = new THREE.Color(this.color.get());
				light.groundColor = new THREE.Color(this.color.get());
				light.intensity = this.intensity.get();
				break;
			default: throw new Error("Invalid camera type: " + this.type.get());
		}

		// Call the parent class
		super.update();

		// Show a message on console
		// console.log("Light Updated: " + this.name.get() + " "
		// 	+ this.position + " " + this.rotation );
	}
}

/** Defines a Button Widget. */
class Button extends Widget {

	/** Initializes a new Button Instance.
	 * @param name The name of the Widget.
	 * @param parent The parent of the Widget.
	 * @param {*} params The creation parameters of the Widget. */
	constructor(name, parent, params = {}) {

		// Call the base class constructor
		super(name, parent, params)
		
		// Set the type of the instance
		this.isButton = true;

		// Initialize the parameters
		this.style = new Parameter("Style", this, params.style, 'normal');
		this.label = new Parameter("Label", this, params.label, '');
		
	}


	/** Updates the Widget. */
	update() {

		// Make sure that the Widget is *not* updated
		if (this.updated) return;

		// If the style is not updated, (re)create the geometries
		if(!this.style.updated) {
			let style = this.style.get();

			// Reset the entity list (deleting any previous one)
			this.entities.forEach(entity => {entity.delete();})
			this.entities = []; this.shapes = {};

			this.shapes["Cylinder"] = new Cylinder("Cylinder", this, {
				x: 0, y: 0, radius: 1, height:1
			});

			// Create a Geometry entity for each shape
			for (const name in this.shapes) {
				let shape = this.shapes[name];
				let position = (shape.position)? shape.position : new Vector(0,0,0);

				this.entities.push(new Geometry(name + "Geometry", 
					this, {shape: shape, position: position}));
			}
		}
	
		// Call the base function
		super.update();
		this.updated = false;

		// Show a message on console
		// console.log("Gauge Updated: " + this.name);
	}
}

/** Defines a Gauge Widget. */
class Gauge extends Widget {

	/** Initializes a new Gauge Instance.
	 * @param name The name of the Widget.
	 * @param parent The parent of the Widget.
	 * @param {*} params The creation parameters of the Widget. */
	constructor(name, parent, params = {}) {

		// Call the base class constructor
		super(name, parent, params)
		
		// Set the type of the instance
		this.isGauge = true;


		// Initialize the parameters
		this.style = new Parameter("Style", this, params.style, 'normal');
		this.label = new Parameter("Label", this, params.label, '');
		this.value = new Parameter("Value", this, params.value, 0);
		this.units = new Parameter("Units", this, params.units, '');
		this.valueMin = new Parameter("ValueMin", this, params.valueMin, 0);
		this.valueMax = new Parameter("ValueMax", this, params.valueMax, 1);
		this.valueLow = new Parameter("ValueLow", this, params.valueLow, 0);
		this.valueHigh = new Parameter("ValueHigh", this, params.valueHigh, 1);
		this.valueDigits = new Parameter("ValueDigits", this, params.valueDigits, 0);
	}


	/** Updates the Widget. */
	update() {

		// Make sure that the Widget is *not* updated
		if (this.updated) return;

		// If the style is not updated, (re)create the geometries
		if(!this.style.updated) {
			let style = this.style.get();

			// Reset the entity list (deleting any previous one)
			this.entities.forEach(entity => {entity.delete();})
			this.entities = []; this.shapes = {};
			let divisions = (this.valueMax - this.valueMin) / 10;

			// Create different shapes depending on the style
			switch (this.style.get()) {
				case 'normal':
					this.warp = new Warp({factor:270, offset:-135});
					this.shapes["ValueShape"] = new Box("ValueShape", this, {
						x: 0, y: 0, width: 0.01, height: 0.01, depth: 0.45, 
						modifiers:[this.warp], position: new Vector(0,0,0.01),
					});
					for (let division = 0; division <= divisions; division++) {
						let name = "DivisionShape" + division;
						let major = division % 2;
						let x = (1/divisions)* division -0.005;
						let y = 0.35 + (0.05 * major);
						let depth = 0.5 - y;
						this.shapes[name] = new Box(name, this, {
							x: x, y:y , width: 0.01, height: 0.01, depth: depth, 
							modifiers:[this.warp],
						});
					}
					this.shapes["Cylinder"] = new Cylinder("Cylinder", this, {
						x: 0, y: 0, radius: 0.1, height:0.1
					});
					this.shapes["LowRangeShape"] = new Box("LowRangeShape", this, {
						x: 0, y: 0.4, width:0.1, height: 0.001, depth: 0.1,
						color: new Color(0.25, 0.25, 1.0),
						modifiers: [this.warp]
					});
					this.shapes["NormalRangeShape"] = new Box("NormalRangeShape", this,{
							x: 0.1, y: 0.4, width:0.8, height: 0.001, depth: 0.1,
							color: new Color(0.25, 0.25, 0.25),
							modifiers: [this.warp]
					});
					this.shapes["HighRangeShape"] = new Box("HighRangeShape", this, {
							x: 0.9, y: 0.4, width: 0, height: 0.001, depth: 0.1,
							color: new Color(1.0, 0.25, 0.25),
							modifiers: [this.warp]
					});
					this.shapes["ValueText"] = new Text("ValueText", this, {
						position: new Vector(0,-0.3,0), depth: 0.01, size: 0.1,
						font:"Orbitron", text: this.value,
						numberDigits: this.valueDigits,
					});
					this.shapes["UnitsText"] = new Text("UnitsText", this, {
						position: new Vector(0.05,-0.5,0), depth: 0.01, size: 0.05,
						font:"Orbitron", text: this.units, alignY: 0, alignLine: 0
					});
					this.shapes["LabelText"] = new Text("LabelText", this, {
						position: new Vector(-0.05,-0.5,0), depth: 0.01, size: 0.05,
						font:"Orbitron", text: this.label, alignY: 0, alignLine: 1
					}); 
					break;
				case 'industrial':
					this.warp = new Warp({factor:120, offset:-60});
					this.shapes["ValueShape"] = new Box("ValueShape", this, {
						x: 0, y: 0, width: 0.01, height: 0.01, depth: 0.35, 
						modifiers:[this.warp], position: new Vector(0,0,0.01),
						color: new Color(0,0,0)
					});
					for (let division = 0; division <= divisions; division++) {
						let name = "DivisionShape" + division;
						let major = division % 2;
						let x = (1/divisions)* division -0.005;
						let y = 0.25 + (0.05 * major);
						let depth = 0.4 - y;
						this.shapes[name] = new Box(name, this, {
							x: x, y:y , width: 0.01, height: 0.01, depth: depth, 
							modifiers:[this.warp], color: new Color(0,0,0)
						});
					}
					this.shapes["Cylinder"] = new Cylinder("Cylinder", this, {
						x: 0, y: 0, radius: 0.05, height:0.1, color: new Color(0,0,0)
					});
					this.shapes["BackCylinder"] = new Cylinder("Cylinder", this, {
						x: 0, y: 0, position: new Vector(0,0,-0.1), radius: 0.5, height:0.1
					});
					this.shapes["LowRangeShape"] = new Box("LowRangeShape", this, {
						x: 0, y: 0.3, width:0.1, height: 0.005, depth: 0.1,
						color: new Color(0.25, 0.75, 0.25),
						modifiers: [this.warp]
					});
					this.shapes["NormalRangeShape"] = new Box("NormalRangeShape", this,{
							x: 0.1, y: 0.3, width:0.8, height: 0.005, depth: 0.1,
							color: new Color(0.25, 0.25, 0.25),
							modifiers: [this.warp]
					});
					this.shapes["HighRangeShape"] = new Box("HighRangeShape", this, {
							x: 0.9, y: 0.3, width: 0, height: 0.005, depth: 0.1,
							color: new Color(1.0, 0.25, 0.25),
							modifiers: [this.warp]
					});
					this.shapes["ValueText"] = new Text("ValueText", this, {
						position: new Vector(0,-0.3,0), depth: 0.01, size: 0.1,
						font:"Orbitron", text: this.value,
						numberDigits: this.valueDigits,
						color: new Color(0,0,0),
					});
					this.shapes["UnitsText"] = new Text("UnitsText", this, {
						position: new Vector(0.0,-0.4,0), depth: 0.01, size: 0.05,
						font:"Orbitron", text: this.units, alignY: 1,
						color: new Color(0,0,0),
					});
					this.shapes["LabelText"] = new Text("LabelText", this, {
						position: new Vector(0,-0.2,0), depth: 0.01, size: 0.05,
						font:"Orbitron", text: this.label, alignY: 0,
						color: new Color(0,0,0),
					}); 
					break;
				case 'medical':
						this.warp = new Warp({factor:240, offset:-120});
						this.shapes["ValueShape"] = new Box("ValueShape", this, {
							x: -0.05, y: 0.3, width: 0.1, height: 0.01, depth: 0.2, 
							modifiers:[this.warp]
						});
						this.shapes["LowRangeShape"] = new Box("LowRangeShape", this, {
							x: 0, y: 0.35, width:0.1, height: 0.01, depth: 0.1,
							color: new Color(0.25, 0.25, 1.0), materialSide: 'back',
							modifiers: [this.warp]
						});
						this.shapes["NormalRangeShape"] = new Box("NormalRangeShape", this,{
								x: 0.1, y: 0.35, width:0.8, height: 0.01,  depth: 0.1,
								color: new Color(0.25, 0.25, 0.25),	materialSide: 'back',
								modifiers: [this.warp]
						});
						this.shapes["HighRangeShape"] = new Box("HighRangeShape", this, {
								x: 0.9, y: 0.35, width: 0, height: 0.01, depth: 0.1,
								color: new Color(1.0, 0.25, 0.25), materialSide: 'back',
								modifiers: [this.warp]
						});
						this.shapes["ValueText"] = new Text("ValueText", this, {
							depth: 0.01, size: 0.15,
							font:"Orbitron", text: this.value,
							numberDigits: this.valueDigits,
						});
						this.shapes["UnitsText"] = new Text("UnitsText", this, {
							position: new Vector(0,-0.15,0), depth: 0.01, size: 0.06,
							font:"Orbitron", text: this.units, alignY: 1
						});
						this.shapes["LabelText"] = new Text("LabelText", this, {
							position: new Vector(0,0.15,0), depth: 0.01, size: 0.06,
							font:"Orbitron", text: this.label, alignY: 0,
						});
						break;
				case 'aerospace':
					this.warp = new Warp({factor:240, offset:-120});
					this.shapes["ValueShape"] = new Box("ValueShape", this, {
						x: 0, y: 0.4, width: 1, height: 0.01, depth: 0.1, 
						modifiers:[this.warp],
					});
					this.shapes["MinValueShape"] = new Box("MinValueShape", this, {
						y: 0.35, width: -0.01, height: 0.01, depth: 0.15, 
						modifiers:[this.warp],
					});
					this.shapes["MaxValueShape"] = new Box("MaxValueShape", this, {
							x:1, y: 0.35, width: 0.01, height: 0.01, depth: 0.15, 
							modifiers:[this.warp],
					});
						this.shapes["LowRangeShape"] = new Box("LowRangeShape", this, {
							x: 0, y: 0.4, width:0.1, height: 0.01, depth: 0.1,
							color: new Color(0.25, 0.25, 1.0), materialSide: 'back',
							modifiers: [this.warp]
					});
					this.shapes["NormalRangeShape"] = new Box("NormalRangeShape", this,{
							x: 0.1, y: 0.4, width:0.8, height: 0.01,  depth: 0.1,
							color: new Color(0.25, 0.25, 0.25),	materialSide: 'back',
							modifiers: [this.warp]
					});
					this.shapes["HighRangeShape"] = new Box("HighRangeShape", this, {
							x: 0.9, y: 0.4, width: 0, height: 0.01, depth: 0.1,
							color: new Color(1.0, 0.25, 0.25), materialSide: 'back',
							modifiers: [this.warp]
					});
					this.shapes["ValueText"] = new Text("ValueText", this, {
						depth: 0.01, size: 0.22,
						font:"Orbitron", text: this.value,
						numberDigits: this.valueDigits,
					});
					this.shapes["UnitsText"] = new Text("UnitsText", this, {
						position: new Vector(0,-0.15,0), depth: 0.01, size: 0.08,
						font:"Orbitron", text: this.units, alignY: 1
					});
					this.shapes["LabelText"] = new Text("LabelText", this, {
						position: new Vector(0,0.15,0), depth: 0.01, size: 0.08,
						font:"Orbitron", text: this.label, alignY: 0,
					});
					break;
				case 'futuristic':
					this.warp = new Warp({factor:270, offset:-180});
					this.shapes["ValueShape"] = new Box("ValueShape", this, {
						x: 0, y: 0.3, width:0.1, height: 0.01, depth: 0.1, 
						position: new Vector(0,-0.1,0),color: new Color(1, 1, 1),
						modifiers:[this.warp],
					});
					this.shapes["LowRangeShape"] = new Box("LowRangeShape", this, {
						x: 0, y: 0.3, width:0.1, height: 0.01, depth: 0.1, 
						position: new Vector(0,-0.1,0),
						color: new Color(0.25, 0.25, 1.0), materialSide: 'back',
						modifiers: [this.warp]
					});
					this.shapes["NormalRangeShape"] = new Box("NormalRangeShape", this,{
						x: 0.1, y: 0.3, width:0.8, height: 0.01, depth: 0.1, 
						color: new Color(0.25, 0.25, 0.25),	materialSide: 'back',
						position: new Vector(0,-0.1,0),
						modifiers: [this.warp]
					});
					this.shapes["HighRangeShape"] = new Box("HighRangeShape", this, {
						x: 0.9, y: 0.3, width: 0, height: 0.01, depth: 0.1,  
						color: new Color(1.0, 0.25, 0.25), materialSide: 'back',
						position: new Vector(0,-0.1,0),
						modifiers: [this.warp]
					});
					this.shapes["ValueText"] = new Text("ValueText", this, {
						position: new Vector(0,-0.1,0), depth: 0.01,
						font:"Orbitron", size: 0.16, text: this.value,
						numberDigits: this.valueDigits,
					});
					this.shapes["UnitsText"] = new Text("UnitsText", this, {
						position: new Vector(0.5,-0.3,0), depth: 0.01, 
						font:"Orbitron", size: 0.08, text: this.units, 
						alignY: 1, alignLine: 1	
					});
					this.shapes["LabelText"] = new Text("LabelText", this, {
						position: new Vector(-0.5, 0.4, 0), depth: 0.01,
						font:"Orbitron", size: 0.08, text: this.label, 
						alignY: 0, alignLine: 0
					});
					break;

				default: throw Error ('Invalid Style for Gauge Widget: ' +
					this.name + '. Valid values are "normal", "futuristic"');
			}

	
			// Create a Geometry entity for each shape
			for (const name in this.shapes) {
				let shape = this.shapes[name];
				let position = (shape.position)? shape.position : new Vector(0,0,0);

				this.entities.push(new Geometry(name + "Geometry", 
					this, {shape: shape, position: position}));
			}
		}

		// Get the value, teh maximum and minimum
		let value = this.value.get(),
			min = this.valueMin.get(),
			max = this.valueMax.get();
		if (min > max) { min = max; max = this.valueMin.get(); }
		if (value > max) value = max; 
		if (value < min) value = min;
		
		// Calculate the range and make sure it is valid
		let range = max - min; 
		if (range !== 0) {

			// Get the low and high values and check the,
			let low = this.valueLow.get(), high = this.valueHigh.get();
			if (low > high)  low = high; 
			if (low <= min || low >= max) low = min;
			if (high <= min || high >= max) high = max;

			// convert all values to percentage
			value = (value - min) / (range);
			low = (low - min) / (range); 
			high = (high - min) / (range); 

			// Draw the background
			if (this.shapes["LowRangeShape"]) this.shapes["LowRangeShape"].x.set(0);
			if (this.shapes["LowRangeShape"])this.shapes["LowRangeShape"].width.set(low);
			if (this.shapes["NormalRangeShape"])this.shapes["NormalRangeShape"].x.set(low);
			if (this.shapes["NormalRangeShape"])this.shapes["NormalRangeShape"].width.set(high - low);
			if (this.shapes["HighRangeShape"])this.shapes["HighRangeShape"].x.set(high);
			if (this.shapes["HighRangeShape"])this.shapes["HighRangeShape"].width.set(1 - high);

			if (this.style == 'normal' || this.style == 'industrial' || this.style == 'medical') {
				this.shapes["ValueShape"].x.set(value);
			}
			else this.shapes["ValueShape"].width.set(value);
		}

		// Call the base function
		super.update();
		this.updated = false;

		// Show a message on console
		// console.log("Gauge Updated: " + this.name);
	}
}
