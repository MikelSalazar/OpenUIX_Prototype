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
