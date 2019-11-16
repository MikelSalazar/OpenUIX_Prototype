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
