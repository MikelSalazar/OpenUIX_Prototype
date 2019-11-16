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
