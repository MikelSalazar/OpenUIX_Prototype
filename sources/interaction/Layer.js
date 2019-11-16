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