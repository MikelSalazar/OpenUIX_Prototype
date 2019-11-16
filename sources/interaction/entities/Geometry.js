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
