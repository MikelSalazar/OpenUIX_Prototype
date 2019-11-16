/** Defines a Skew Modifier. */
class Skew extends Modifier {

	/** Initializes a new Skew instance. 
	 * @param {*} params The creation parameters of the Skew. */
	constructor(params = {}) {

		// Call the base class constructor
		super(params);

		// Set the type of the instance
		this.isWarp = true;

		// Define the properties of the Warp
		this.factor = params.factor || 1;
	}


	/** Applies the modifier. */
	apply(parts) {

		let partIndex = 0, partCount = parts.length;
		for (partIndex = 0; partIndex < partCount; partIndex++) {
			let part = parts[partIndex];
			let vertexIndex = 0, vertexCount = part.vertices.length / 2;
			for (vertexIndex = 0; vertexIndex < vertexCount; vertexIndex++) {
				let vertexDataIndex = vertexIndex * 2;
				part.vertices[vertexDataIndex + 1] +=
					part.vertices[vertexDataIndex + 0] * this.factor;
			}
		}		
		// console.log("Skew");
	}
}
