/** Defines a Curve Segment. */
class CurveSegment extends Segment {

	/** Initializes a new CurveSegment Instance.
	 * @param {*} params The creation parameters of the Segment. */
	constructor(params = {}) { 
		
		// Call the parent class constructor
		super(params);

		// Define the fields
		this.isCurveSegment = true;
		this.controlPoints = params.controlPoints || [];
	}


	/** Create a copy of the Segment. */
	clone() { return new CurveSegment(this); }


	/** Updates the Segment data.
	* @param {*} forced Indicates whether to force the update or not.
	* @param {*} params Interpolation parameters. */
	update(forced = false, params = {}) {
	
		// Check if the Segment must be updated
		if(this.updated && !forced) return;

		// Initialize the list of points
		this.points = [];
		this.points.push(this.pointStart);
		this.points.pushArray(this.controlPoints);
		this.points.push(this.pointEnd);

		// Check that we have enough points to begin with
		let pointCount = this.points.length;
		if (pointCount < 3) throw new Error ("Not enough number of points");

		// Check the dimensions of the points
		if (params.dimensions) this.dimensions = params.dimensions;
		else { // Check the dimensions of the points
			this.dimensions = 2;
			for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
				if (this.points[pointIndex].dimensions == 3) { 
					this.dimensions=3; break; 
				}	
			}
		}

		// Clear the vertex data and add the first point values
		this.vertices = (this.pointStart.get())
		
		// Use the De Casteljau's algorithm to interpolate the segment
		// See: https://en.wikipedia.org/wiki/De_Casteljau's_algorithm
		if (pointCount > 2) {

			//Store the data of all the points into an array
			let pointData = [], tempData = [];
			for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
				const point = this.points[pointIndex];
				pointData.push(point.x, point.y);
				if (this.dimensions > 2) pointData.push(point.z);
			}

			// Start interpolating, step by step
			let stepIndex, stepValue, 
				stepCount = params.steps || Segment.defaultSteps, 
				dimIndex, dimCount = this.dimensions, 
				level, partIndex, dataIndex, v0, v1;
			for (stepIndex = 0; stepIndex < stepCount; stepIndex++) {

				// Calculate the current stepValue and its inverse
				stepValue = (stepIndex + 1) / (stepCount + 1);

				// Go though each level of the inverse triangle
				for (level = pointCount - 1; level > 0; level--) {

					// If it's the initial level, get data from the point data
					let data = (level == pointCount-1)? pointData : tempData;

					// Interpolate each subsegment and each dimension
					for (partIndex = 0; partIndex < level; partIndex++) {
						for (dimIndex = 0; dimIndex < dimCount; dimIndex++) {
							dataIndex = (partIndex * dimCount) + dimIndex;
							v0 = data[dataIndex], v1 = data[dataIndex+dimCount];
							tempData[dataIndex] = v0 + ((v1 - v0) * stepValue);
						}
					}
				}

				// Copy the resulting values for this step
				for (let dimIndex = 0; dimIndex < dimCount; dimIndex++) {
					this.vertices.push(tempData[dimIndex]);
				}
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