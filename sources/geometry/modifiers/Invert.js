/** Defines a Invert Modifier. */
class Invert extends Modifier {

	/** Initializes a new Invert instance. 
	 * @param {*} params The creation parameters of the Invert. */
	constructor(params = {}) {

		// Call the base class constructor
		super(params);

		// Set the type of the instance
		this.isInvert = true;
	}

	/** Applies the modifier. */
	apply(parts) {
		console.log("Inverting");
		let partIndex = 0, partCount = parts.length;
		for (partIndex = 0; partIndex < partCount; partIndex++) {
			let part = parts[partIndex], newVertices = [];
			
			let vertexIndex = 0, vertexCount = part.vertices.length / 2;
			for (vertexIndex = vertexCount-1; vertexIndex >= 0; vertexIndex--) {
				let vertexDataIndex = vertexIndex * 2;
				let xA = part.vertices[vertexDataIndex++],
					yA = part.vertices[vertexDataIndex++];
				newVertices.push(xA,yA);
			}
			part.vertices = newVertices;
		}		
	}
}
