/** Defines a Geometric Path. */
class Path {

	/** Initializes a new Path instance. 
	 * @param {*} params The creation parameters of the Path. */
	constructor(params = {}) {

		// Define the segments of the Path
		this.segments = []; 
		if (params.segments) params.segments.forEach(
			segment => { this.segments.push(segment.clone()); }
		);
	
		// Define the data elements of the Path
		let data = this.data = {};
		data.parts		= params.parts		|| [];
		data.vertices	= params.vertices	|| [];
		data.lengths	= params.lengths	|| [];
		data.tangents	= params.tangents	|| [];
		data.normals	= params.normals	|| [];
		data.binormals	= params.binormals	|| [];
		data.edges		= params.edges		|| [];
		data.holes		= params.holes		|| [];
		data.faces		= params.faces		|| [];
		data.vertexCount = 0;

		// Copy the modifiers
		this.modifiers = [];
		if (params.modifiers) this.modifiers = [...params.modifiers];
		
		// Define the properties of the Path
		this.isPath = true;
		this.reverse = params.reversed || false;
		this.updated = params.updated || false;
		this.dimensions = params.dimensions || 0; 
	}


	/** Create a copy of the Path. */
	clone() { return new Path(this); }

	/** Combines this Path with another. 
	 * @param path The path to join with.
	 * @returns The current path instance. */
	join(path, position = null, rotation = null, scale = null) {

		// Make sure both the current path and the resulting path are updated
		if(!this.updated) this.update();
		if(!path.updated) path.update();

		// Add the segments
		this.segments.pushArray(path.segments); 

		// Create variables to operate with the data
		let dataOffset = this.data.vertices.length /3,
			vertexDataSize = path.data.vertices.length, 
			edgeDataSize = path.data.edges.length,
			faceDataSize = path.data.faces.length;
		
		// Add the vertex data
		for (let vertexIndex = 0; vertexIndex < vertexDataSize; vertexIndex++) {
			let vertexPosition = path.data.vertices[vertexIndex];
			if (position) vertexPosition += position.getAt(vertexIndex % 3);
			if (scale) vertexPosition *= scale.getAt(vertexIndex % 3);

			this.data.vertices.push(vertexPosition);
			this.data.tangents.push(path.data.tangents[vertexIndex]);
			this.data.normals.push(path.data.normals[vertexIndex]);
			this.data.binormals.push(path.data.binormals[vertexIndex]);
		}

		// Add the edge data
		for (let edgeIndex = 0; edgeIndex < edgeDataSize; edgeIndex++) {
			this.data.edges.push(path.data.edges[edgeIndex] + dataOffset);
		}

		// Add the face data
		for (let faceIndex = 0; faceIndex < faceDataSize; faceIndex++) {
			this.data.faces.push(path.data.faces[faceIndex] + dataOffset);
		}

		// Update the number of vertices
		this.data.vertexCount = this.data.vertices.length / 3;


		// Mark the form as updated
		this.updated = true;

		// Return the current path instance
		return this; 
	}


	/** Updates the Path data.
	* @param {*} forced Indicates whether to force the update or not.
	* @param {*} params The update parameters parameters. */
	update(forced, params = {}) {
		
		// Check if the Path must be updated
		if(this.updated && !forced) return;

		// Reset the data
		let data = this.data;
		data.parts = []; data.vertices = []; 
		data.lengths = []; data.angles = []; 
		data.tangents = []; data.normals = []; data.binormals = []; 
		data.edges = []; data.holes = [], data.faces = [];
				
		// Create several variables to operate with the segments of the path
		let segmentIndex = 0, segmentCount = this.segments.length;
		if (segmentCount == 0) return;
		

		// Check the dimensions of the segments
		if (params.dimensions) this.dimensions = params.dimensions;
		else {
			this.dimensions = 2;
			for (segmentIndex = 0; segmentIndex < segmentCount; segmentIndex++){
				this.segments[segmentIndex].update();
				const segmentDims = this.segments[segmentIndex].dimensions;
				if (this.dimensions<segmentDims) this.dimensions = segmentDims;
			}
		}

		// Define the properties for the interpolation
		let dimensions = this.dimensions, planar = (this.dimensions == 2),
			sigma = 0.001,
			minLength = params.minLength || sigma,
		 	maxLength = params.maxLength || Infinity,
			minAngle = params.minAngle || sigma,
			maxAngle = params.maxAngle || Segment.defaultMaxAngle,
			interpolateAngles = params.interpolateAngles || false,
			reversed = params.reversed || this.reversed;
		if (minLength > maxLength) minLength = maxLength;
		if (minAngle > maxAngle) minAngle = maxAngle;

		// Interpolate the segments and obtain the different parts (polylines)
		let part = {vertices:[], closed: false}, allPartsClosed = true,
			partPointStart = this.segments[0].pointStart;
		for (segmentIndex = 0; segmentIndex < segmentCount; segmentIndex++) {
			const segment = this.segments[segmentIndex],
				nextSegment = this.segments[(segmentIndex + 1) % segmentCount],
				chained=Vector.equals(segment.pointEnd, nextSegment.pointStart);
			segment.update(true,{dimensions:dimensions, skipLastPoint:chained});
			part.vertices.pushArray(segment.vertices);
			if (!chained || segmentIndex==segmentCount-1) {
				part.closed = Vector.equals(segment.pointEnd, partPointStart);
				if (!part.closed) allPartsClosed = false;
				data.parts.push(part);
				part = { vertices:[], closed: false };
				partPointStart = nextSegment.pointStart;
			}
		}

		if (reversed) {
			// Process the different parts
			let partIndex = 0, partCount = data.parts.length;
			for (partIndex = 0; partIndex < partCount; partIndex++) {
				let part = data.parts[partIndex], newVertices = [];
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

		// Apply the modifiers
		let modifierIndex = 0, modifierCount = this.modifiers.length;
		for (modifierIndex = 0; modifierIndex < modifierCount; modifierIndex++){
			this.modifiers[modifierIndex].apply(data.parts);
		}
		
		

		// Process the different parts
		let partIndex = 0, partCount = data.parts.length;
		for (partIndex = 0; partIndex < partCount; partIndex++) {

			// Get the current part
			let part = data.parts[partIndex];

			// Create the necessary variables
			let posX, posY, posZ = 0, // Current vertex Position
				nextX, nextY, nextZ = 0, // Next vertex Position
				tangentX, tangentY, tangentZ = 0,
				normalX = 0, normalY = 0, normalZ = 1,
				binormalX = 0, binormalY = 0, binormalZ = -1,
				previousNormalX, previousNormalY, previousNormalZ = 0,
				smoothNormalX, smoothNormalY, smoothNormalZ = 0,
				previousTangentX, previousTangentY, previousTangentZ,
				length, angle;
				
			// If the path is closed, precalculate the last part
			if (part.closed) {
				let d = part.vertices.length - dimensions,
					tX = part.vertices[0] - part.vertices[d++],
					tY = part.vertices[1] - part.vertices[d++],
					tZ = (!planar)? part.vertices[2] - part.vertices[d++] : 0;
				length = Math.sqrt((tX * tX) + (tY * tY) + (tZ * tZ));
				if (length > 0) {
					previousTangentX = tX/length; previousTangentY = tY/length; 
					previousTangentZ = (!planar)? tZ/length : 0;

					if (planar) {
						previousNormalX = -previousTangentY;
						previousNormalY = previousTangentX; 
						previousNormalZ = 0;
					}
					else {
						previousNormalX = 1; previousNormalY = 0; 
						previousNormalZ = 0;
					}
				}
			}

			// Parse each vertex of the part
			let vertexIndex = 0, vertexCount = part.vertices.length/dimensions,
				nextVertexIndex, isFirstVertex = true, isLastVertex = false;
			while (vertexIndex < vertexCount) {

				// Calculate the next vertex index
				nextVertexIndex = vertexIndex + 1;
				isFirstVertex = (vertexIndex == 0);
				isLastVertex = (nextVertexIndex == vertexCount);


				// Get the position of the current vertex
				let vertexDataIndex = vertexIndex * dimensions;
				posX = part.vertices[vertexDataIndex];
				posY = part.vertices[vertexDataIndex+1];
				posZ = (!planar)? part.vertices[vertexDataIndex+2] : 0;

				let smoothed = false;
				
				// Calculate the length and angle within the given range
				let finalVertexIndex = vertexCount + ((part.closed)? 1: 0);
				while (nextVertexIndex <= finalVertexIndex) {

					// If the part is open, don't process the last vertex
					if(!part.closed && isLastVertex) break;
					
					// Get the position of the next vertex
					vertexDataIndex = (nextVertexIndex%vertexCount)*dimensions;
					nextX = part.vertices[vertexDataIndex];
					nextY = part.vertices[vertexDataIndex+1];
					nextZ = (!planar)? part.vertices[vertexDataIndex+2] : 0;

					// Calculate the length, tangent and angle
					if (planar) {
						let tX = nextX - posX, tY = nextY - posY;
						length = Math.sqrt((tX * tX) + (tY * tY));
						tangentX = tX/length; tangentY = tY/length;
						if (isFirstVertex && !part.closed) angle = minAngle;
						else angle = Math.acos((tangentX * previousTangentX) + 
							(tangentY * previousTangentY)) * RAD_TO_DEG;
						binormalX = 0; binormalY = 0; binormalZ = -1;
						normalX = -tangentY; normalY = tangentX; normalZ = 0;
					} else {
						let tX = nextX-posX, tY = nextY-posY, tZ = nextZ-posZ;
						length = Math.sqrt((tX * tX) + (tY * tY) + (tZ * tZ));
						tangentX = tX/length; tangentY = tY/length; 
						tangentZ = tZ/length;
						if (isFirstVertex && !part.closed) angle = minAngle;
						else angle = Math.acos((tangentX * previousTangentX) + 
								(tangentY * previousTangentY) + 
								(tangentZ * previousTangentZ)) * RAD_TO_DEG;
						binormalX = 0; binormalY = 1; binormalZ = 0;
						normalX = 1; normalY = 0; normalZ = 0;
					}

					// If the angle is too small, skip this vertex
					if (angle < minAngle && !isLastVertex) { 
						nextVertexIndex++; continue;
					}

					// If the angle is too steep, duplicate the vertices
					if (angle > maxAngle+sigma) {
						data.lengths.push(0); data.angles.push(angle);
						data.vertices.push(posX, posY, posZ);
						data.tangents.push(tangentX, tangentY, tangentZ);
						data.normals.push(previousNormalX, 
							previousNormalY, previousNormalZ);
						data.binormals.push(binormalX, binormalY, binormalZ);
					}

					// If the length and the angle are with the parameters
					if (length>minLength && (isFirstVertex || angle>minAngle)) {
						//Smooth the normal
						let sX = (previousNormalX + normalX) / 2,
							sY = (previousNormalY + normalY) / 2,
							sZ = (previousNormalZ + normalZ) / 2,
							ls = Math.sqrt((sX * sX) + (sY * sY) + (sZ * sZ));
						if (ls > 0 && angle < maxAngle + sigma) {
							smoothed = true;
							smoothNormalX = sX / ls;
							smoothNormalY = sY / ls;
							smoothNormalZ = sZ / ls;

							if (isNaN(smoothNormalX)) smoothNormalX = normalX;
							if (isNaN(smoothNormalY)) smoothNormalY = normalY;
							if (isNaN(smoothNormalZ)) smoothNormalZ = normalZ;
						}
						break;
					}
					nextVertexIndex++;
				}

				// Save the vertex data (always in 3D)
				data.lengths.push(length); data.angles.push(angle);
				data.vertices.push(posX, posY, posZ);
				data.tangents.push(tangentX, tangentY, tangentZ);
				data.binormals.push(binormalX, binormalY, binormalZ);
				if (smoothed) data.normals.push(
					smoothNormalX, smoothNormalY, smoothNormalZ);
				else data.normals.push(normalX, normalY, normalZ);
				
				previousTangentX = tangentX;
				previousTangentY = tangentY;
				previousTangentZ = tangentZ;

				previousNormalX = normalX;
				previousNormalY = normalY;
				previousNormalZ = normalZ;

				// Go to the next vertex index
				vertexIndex = nextVertexIndex;
			}

			// Create the edges
			vertexIndex = data.vertexCount;
			let lastVertexIndex = (data.vertices.length / 3) - 1;
			while (vertexIndex <= lastVertexIndex) {
				if (data.lengths[vertexIndex] > 0) {
					nextVertexIndex = vertexIndex + 1;
					if (vertexIndex == lastVertexIndex) {
						if (!part.closed) break;
						nextVertexIndex = data.vertexCount;
					}
					data.edges.push(vertexIndex, nextVertexIndex);
				}
				vertexIndex++;
			}

			// Update the vertex count
			data.vertexCount = data.vertices.length / 3;

			// If its the last vertex and its not the last part, add a hole
			if (partIndex < (partCount - 1)) data.holes.push(data.vertexCount);
		}

		// Create the faces
		if (planar && allPartsClosed) {

			let vertices = data.vertices, holes = data.holes, 
				triangleData, offset = 0;

			// If there is more than one part, make sure to process them
			if (partCount > 1) {
				for (partIndex = 0; partIndex < partCount; partIndex++) {
					
					// Calculate the data
					triangleData = Earcut.triangulate(vertices, holes, 3);

					// Copy the data, adding  offset
					let dataIndex = 0, dataSize = triangleData.length;
					if (dataSize == 0) break;
					for (dataIndex = 0; dataIndex < dataSize; dataIndex++) {
						let vertexIndex = triangleData[dataIndex] + offset;
						data.faces.push(vertexIndex);

						// Check if the value is part of a part index
						if (partIndex < partCount && 
							vertexIndex > data.holes[partIndex]) partIndex++;
					}

					// if there is still parts without holes, update the data
					if (partIndex < partCount) {
						offset = data.holes[partIndex]; 
						vertices = data.vertices.slice(offset * 3);
						holes = data.holes.slice(partIndex+1);
						let holeIndex, holeCount = holes.length;
						for (holeIndex = 0; holeIndex < holeCount; holeIndex++)
							holes[holeIndex] -= offset;
					}
				}
			} else data.faces = Earcut.triangulate(vertices, holes, 3);

		}

		// Mark the path as updated
		this.updated = true;

		// Show a message on console
		// console.log("Path updated");
	}
}