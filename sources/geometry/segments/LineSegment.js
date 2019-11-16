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
