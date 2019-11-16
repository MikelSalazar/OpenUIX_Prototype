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