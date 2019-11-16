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