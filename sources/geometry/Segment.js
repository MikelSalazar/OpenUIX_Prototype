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
