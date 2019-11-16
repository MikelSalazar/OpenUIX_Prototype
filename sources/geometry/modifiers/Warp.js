/** Defines a Warp Modifier. */
class Warp extends Modifier {

	/** Initializes a new Warp instance. 
	 * @param {*} params The creation parameters of the Warp. */
	constructor(params = {}) {

		// Call the base class constructor
		super(params);

		// Set the type of the instance
		this.isWarp = true;

		// Define the properties of the Warp
		this.sectors = params.sectors || (360 / Segment.defaultMaxAngle);
		this.factor = params.factor || 360;
		this.offset = params.offset || 0;
	}

	/** Applies the modifier. */
	apply(parts) {

		let sectorWidth = (Math.PI * 2) / this.sectors,
			angleOffset = this.offset * DEG_TO_RAD,
			angleFactor = this.factor * DEG_TO_RAD;


		let partIndex = 0, partCount = parts.length;
		for (partIndex = 0; partIndex < partCount; partIndex++) {
			let part = parts[partIndex], newVertices = [];

			let vertexIndex = 0, vertexCount = part.vertices.length / 2;
			for (vertexIndex = 0; vertexIndex < vertexCount; vertexIndex++) {

				// Calculate the initial point
				let vertexDataIndex = vertexIndex * 2;
				let xA = part.vertices[vertexDataIndex++],
					yA = part.vertices[vertexDataIndex++];

				xA = (xA * angleFactor) + angleOffset;
				let sectorA = Math.floor((xA) / sectorWidth);

				let pa = sectorA * sectorWidth, 
					na = (sectorA + 1) * sectorWidth,
					t = (xA - pa) / (na - pa),
					pX = Math.sin(pa) * yA, pY = Math.cos(pa) * yA,
					nX = Math.sin(na) * yA, nY = Math.cos(na) * yA;
				newVertices.push(pX + t * (nX-pX), pY + t * (nY-pY))

				// Check if we reached the end
				if (vertexIndex == vertexCount -1) {
					if (part.closed) vertexDataIndex = 0
					else break;
				}

				// Calculate the rest of the points of the line
				let xB = part.vertices[vertexDataIndex++],
					yB = part.vertices[vertexDataIndex++];
				xB = (xB * angleFactor) + angleOffset;
				let sectorB = Math.floor((xB) / sectorWidth);
				if (sectorA == sectorB) continue;
				let angle, distance, sameDistance = (yA == yB);
				let i = (sectorA < sectorB)? 1 : -1,
					o = (sectorA < sectorB)? 1 : 0;
				if (sameDistance) distance = yA;
				for (let sector = sectorA; sector !== sectorB; sector += i) {
					let x = (sector + o) * sectorWidth;
					if (!sameDistance) {
						t = (x - xA) / (xB - xA);
						distance = yA + t * (yB - yA)
					}
					angle = x;
					newVertices.push(Math.sin(angle) * distance, 
						Math.cos(angle) * distance);
				}
			}
			part.vertices = newVertices;
		}		
		// console.log("Warping");
	}
}
