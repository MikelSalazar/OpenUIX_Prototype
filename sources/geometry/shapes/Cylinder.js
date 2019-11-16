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