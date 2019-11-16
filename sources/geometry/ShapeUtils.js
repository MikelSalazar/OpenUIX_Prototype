/* Provides several functions to operate with profile. */
class ShapeUtils {

	/** Creates a Shape by extruding a Path along another Path. 
	 * @param shape The Shape to generate.
	 * @param profile The profile Path to extrude.
	 * @param {*} path The extrusion Path (or a number with its height). 
	 * @param {*} params Additional extrusion parameters. */
	static extrude (shape, profile, path = 0, params = {}) {

		// Operate over the shape geometry
		let geometry = shape.geometry;

		// Process the additional parameters
		let cap = params.cap || true,
			debug = params.debug || shape.debug || false,
			computeNormals = params.computeNormals || true,
			computeUvs = params.computeUvs || true,
			sides = params.sides || 2;

		let vertices, normals, faces = [],
			vertexDataIndex = 0, normalDataIndex = 0, faceDataIndex = 0;

		if (sides < 1) sides = 1; if (sides > 2) sides = 2;

			
		// Check if the profile and paths have to be updated
		let profileUpdated = false, pathUpdated = false;
		
		// Check the profile
		if (!profile||!profile.isPath) throw Error('Invalid extrusion profile');
		if (!profile.updated) { profile.update(); profileUpdated = true; }
		let profileVertices = profile.data.vertices,
			profileVertexDataSize = profileVertices.length,
			profileNormals = profile.data.normals,
			profileEdges = profile.data.edges,
			profileEdgeDataSize = profileEdges.length,
			profileFaces = profile.data.faces,
			profileFaceDataSize = profileFaces.length,
			profilePointCount = profileVertexDataSize / 3;

		// Check the path
		if (path !== 0) {
		
			let pathIsVertical = false;
			if (typeof path == "number") {
				if (!geometry.extrusionDepth||geometry.extrusionDepth !== path){
					geometry.extrusionDepth = path; pathUpdated = true;
				}
				path = new Path({segments: [new LineSegment({
					pointStart: new Vector(),
					pointEnd: new Vector(0, 0, path)})]});
				pathIsVertical = true;
			}

			// Create the elements of the geometry
			if (!path.updated) { path.update(); pathUpdated = true; }
			let pathVertexDataSize = path.data.vertices.length,
				pathPointCount = pathVertexDataSize / 3;
			if (!pathIsVertical) { // Check if the path is vertical
				pathIsVertical = true;
				for (let pointIndex=0; pointIndex<pathPointCount; pointIndex++){
					let vertexDataIndex = pointIndex * 3;
					if (path.data.vertices[vertexDataIndex] !== 0 ||
						path.data.vertices[vertexDataIndex + 1] !== 0 ) {
						pathIsVertical = false; break;
					}
				}
			}

			// If both the profile and the path have not been updated, do nothing
			if (!profileUpdated && !pathUpdated) return;

			if (profileFaces.length == 0) cap = false;

			// Calculate the number of vertices
			let	capCount = ((cap == true)? (path.data.holes.length+1)*sides:0),
				vertexDataSize=profileVertexDataSize*(pathPointCount+capCount);
			if (shape.vertexBufferSize < vertexDataSize) {
				shape.vertexBufferSize = vertexDataSize;
				shape.geometry.setAttribute('position', 
					new THREE.Float32BufferAttribute(vertexDataSize, 3));
				shape.geometry.setAttribute('normal', 
					new THREE.Float32BufferAttribute(vertexDataSize, 3));
			}
			vertices = geometry.attributes.position.array;
			normals = geometry.attributes.normal.array;


			// Create the geometry for each path point
			for (let pathPointIndex = 0; pathPointIndex < pathPointCount;
				pathPointIndex++) {
				
				// Get the position of the path point
				let pathPointDataIndex = pathPointIndex * 3,
					pX = path.data.vertices[pathPointDataIndex],
					pY = path.data.vertices[pathPointDataIndex + 1],
					pZ = path.data.vertices[pathPointDataIndex + 2],
					nX = path.data.normals[pathPointDataIndex],
					nY = path.data.normals[pathPointDataIndex + 1],
					nZ = path.data.normals[pathPointDataIndex + 2],
					bX = path.data.binormals[pathPointDataIndex],
					bY = path.data.binormals[pathPointDataIndex + 1],
					bZ = path.data.binormals[pathPointDataIndex + 2];

				// Calculate the position of the vertices for this path point
				for (let profilePointIndex = 0;
					profilePointIndex < profileVertexDataSize; 
					profilePointIndex += 3) {

					// Compute the vertices
					let posX = profileVertices[profilePointIndex],
						posY = profileVertices[profilePointIndex+1],
						posZ = profileVertices[profilePointIndex+2];

					vertices[vertexDataIndex++]	= pX + (posX*nX + posY*bX);
					vertices[vertexDataIndex++]	= pY + (posX*nY + posY*bY);
					vertices[vertexDataIndex++]	= (pathIsVertical)? pZ + posZ:
						pZ + (posX*nZ + posY*bZ);

					// Compute the normals
					if (computeNormals) {
						let normalX = profileNormals[profilePointIndex],
							normalY = profileNormals[profilePointIndex+1],
							normalZ = profileNormals[profilePointIndex+2];

						normals[normalDataIndex++] = -(normalX*nX+ normalY*bX);
						normals[normalDataIndex++] = -(normalX*nY+ normalY*bY);
						normals[normalDataIndex++] = (pathIsVertical)? 0: 
							-(normalX*nZ+ normalY*bZ);
					}
				}

				// If its the last path point, just creates vertices
				if (pathPointIndex == pathPointCount - 1) break;

				// Create the edge faces
				let faceOffset = profileEdgeDataSize * pathPointIndex;
				for (let edgeIndex = 0; edgeIndex < profileEdgeDataSize;
					edgeIndex += 2, faceDataIndex += 6) {
					let f0 = profileEdges[edgeIndex + 0] + faceOffset,
						f1 = profileEdges[edgeIndex + 1] + faceOffset,
						f2 = f0 + profilePointCount,
						f3 = f1 + profilePointCount;
					faces.push(f0);faces.push(f1);faces.push(f2);
					faces.push(f2);faces.push(f1);faces.push(f3);
				}
			}

			// Create the caps (if the profile has faces)
			if (cap && profileFaceDataSize > 0) {

				// Create an array of holes in the path
				let holes = [0]; holes.pushArray(path.data.holes);
				
				let dataSize = profileVertexDataSize * pathPointCount;
				let faceOffset;

				// 
				for (let holeIndex = 0; holeIndex < holes.length; holeIndex++) {
					const holePointIndex = holes[holeIndex];

					let capStartIndex = holePointIndex, capEndIndex = 
						(holePointIndex>0)? holePointIndex-1 : pathPointCount-1,
						capStartDataIndex = capStartIndex*profileVertexDataSize, 
						CapEndDataIndex = capEndIndex*profileVertexDataSize;
						
					// Copy the vertex data to create the closing cap
					for (let pi = 0; pi < profilePointCount; pi++) {
						
						// Copy the vertex data
						let vertexIndex = CapEndDataIndex + pi * 3;
						vertices[vertexDataIndex++] = vertices[vertexIndex++];
						vertices[vertexDataIndex++] = vertices[vertexIndex++];
						vertices[vertexDataIndex++] = vertices[vertexIndex++];

						// Compute the normals
						if (computeNormals) {
							normals[normalDataIndex++] = 0;
							normals[normalDataIndex++] = 0;
							normals[normalDataIndex++] = 1;
						}
					}

					// Create the faces
					faceOffset = (vertexDataIndex - profileVertexDataSize) / 3;
					for (let fdi = 0; fdi < profileFaceDataSize; fdi += 3) {
						faces.push(profileFaces[fdi] + faceOffset);
						faces.push(profileFaces[fdi + 1] + faceOffset);
						faces.push(profileFaces[fdi + 2] + faceOffset);
					}


					// Copy the vertex data to create the closing cap
					for (let pi = 0; pi < profilePointCount; pi++) {
	
						// Copy the vertex data
						let vertexIndex = capStartDataIndex + pi * 3;
						vertices[vertexDataIndex++] = vertices[vertexIndex++];
						vertices[vertexDataIndex++] = vertices[vertexIndex++];
						vertices[vertexDataIndex++] = vertices[vertexIndex++];

						// Compute the normals
						if (computeNormals) {
							normals[normalDataIndex++] = 0;
							normals[normalDataIndex++] = 0;
							normals[normalDataIndex++] = -1;
						}
					}

					// Create the faces
					faceOffset = (vertexDataIndex - profileVertexDataSize) / 3;
					for (let fdi = 0; fdi < profileFaceDataSize; fdi += 3) {
						faces.push(profileFaces[fdi] + faceOffset);
						faces.push(profileFaces[fdi + 2] + faceOffset);
						faces.push(profileFaces[fdi + 1] + faceOffset);
					}
				}
			}
		} else { // if there is no path, just create the faces

			// Calculate the number of vertices
			let	vertexDataSize = profileVertexDataSize * sides;
			if (shape.vertexBufferSize < vertexDataSize) {
				shape.vertexBufferSize = vertexDataSize;
				shape.geometry.setAttribute('position', 
					new THREE.Float32BufferAttribute(vertexDataSize, 3));
				shape.geometry.setAttribute('normal', 
					new THREE.Float32BufferAttribute(vertexDataSize, 3));
			}
			vertices = geometry.attributes.position.array;
			normals = geometry.attributes.normal.array;

			// Create the geometry for one or two sides
			for (let side = 0; side < sides; side++) {

				// Copy the vertex data
				for (let vdi = 0; vdi < profileVertexDataSize; vdi++) {
					vertices[vertexDataIndex++] = profileVertices[vdi];
				}

				// Compute the normal data
				if (computeNormals) {
					let normalZ = (side == 0)? +1 : -1;
					for (let ndi = 0; ndi < profileVertexDataSize; ndi += 3) {
						normals[normalDataIndex++] = 0;
						normals[normalDataIndex++] = 0;
						normals[normalDataIndex++] = normalZ;
					}
				}

				// Compute the faces
				let faceOffset = profileVertexDataSize / 3;
				for (let fdi = 0; fdi < profileFaceDataSize; fdi += 3) {
					if (side == 0) {
						faces.push(profileFaces[fdi]);
						faces.push(profileFaces[fdi + 1]);
						faces.push(profileFaces[fdi + 2]);
					} else {
						faces.push(profileFaces[fdi] + faceOffset);
						faces.push(profileFaces[fdi + 2] + faceOffset);
						faces.push(profileFaces[fdi + 1] + faceOffset);
					}
				}
			}
		} 

		// Set the faces and mak the Buffered geometry to be updated
		geometry.setIndex(faces);
		geometry.setDrawRange(0, faces.length);
		geometry.attributes.position.needsUpdate = true;
		geometry.attributes.normal.needsUpdate = true;
		geometry.index.needsUpdate = true;
		geometry.verticesNeedUpdate = true;
		geometry.normalsNeedUpdate = true;
		geometry.elementsNeedUpdate = true;
		// geometry.computeVertexNormals();
		geometry.boundingSphere = new THREE.Sphere(0,2);
		// geometry.computeBoundingSphere();

		// Draw the debug elements
		if (debug) {
			if (!shape.helper) {
				shape.helper = new THREE.VertexNormalsHelper( shape.mesh, 0.1, 0x00ff00, 10 );
				shape.mesh.add(shape.helper);
			}
		
			shape.helper.update();
		} else {
			if (shape.debugLines) {
				shape.mesh.remove(shape.debugLines); shape.debugLines = null;
			}
		}
	}



	/** Reads a Path from a the SVG Path data.
	 * @returns The resulting PathShape. */
	static readSvgPathData (shape, svgPathData, allAbsolute = false) {
		// switch case
	}


	/** Reads the path from SVG data.
	 * @param svgPathData A string with the SVG path data.
	 * @param params Reading parameters
	 * @returns The path with the SVG data. */
	static readSvgPath (svgPathData, params ) {

		// Check the parameters
		if (!svgPathData) throw new Error("Invalid SVG path data");
		
		let path = params.path || new Path();
		let scale = params.scale || 1;

		// Create an internal function to read float values
		let readFloat = ()=> {
			let value = parseFloat(parts[partIndex++])
			if (scale !== 1) value *= scale;
			return value;
		}

		let point, lastPoint, startPoint;
		let parts = svgPathData.split(' ');
		let partIndex = 0, partCount = parts.length;
		while (partIndex < partCount) {

			let command = parts[partIndex++];
			switch (command) {
				case 'm': case 'M': // Move Point
				// if (partIndex > 1 && !Vector.equals(lastPoint, startPoint)) {
				// 	path.segments.push(new LineSegment({
				// 		pointStart: lastPoint, pointEnd: startPoint
				// 	}));
				// }
				point = new Vector(readFloat(), readFloat());
				startPoint = point;
				break;
				case 'l': case 'L': // Line Segment
				point = new Vector(readFloat(), readFloat());
				path.segments.push(new LineSegment({
					pointStart: lastPoint, pointEnd: point
				}));
				break;
				case 'q': case 'Q': // Quadratic Curve Segment
				point = new Vector(readFloat(), readFloat());
				let controlPoint = new Vector(readFloat(), readFloat());
				path.segments.push(new CurveSegment({
					pointStart: lastPoint, pointEnd: point,
					controlPoints: [controlPoint]
				}));
				break;
			}
			lastPoint = point.clone();
		}

		// Return the path with the SVG data
		return path;
	}


	static drawMove(point){
		ShapeUtils.currentInitialPoint = ShapeUtils.currentPoint = point;
	}

	static drawLine(point){
		ShapeUtils.currentPath.segments.push(new LineSegment({
			pointStart: ShapeUtils.currentPoint, pointEnd: point,
		}));
		ShapeUtils.currentPoint = point;
	}

	static drawCurve(point, controlPoints){
		ShapeUtils.currentPath.segments.push(new CurveSegment({
			pointStart: ShapeUtils.currentPoint, pointEnd: point,
			controlPoints: controlPoints
		}));
		ShapeUtils.currentPoint = point;
	}

	static drawArc(point, center, radius, angleStart, angleEnd){
		
		ShapeUtils.currentPath.segments.push(new ArcSegment({
			pointStart:ShapeUtils.currentPoint, pointEnd:point, center:center,
			radius:radius, angleStart:angleStart, angleEnd:angleEnd
		}));
		
		ShapeUtils.currentPoint = point;
	}



	static convertArc(x0, y0, rx, ry, angleX, largeArcFlag, sweepFlag, x , y) {
	
		// See: SVG Essentials (2nd edition) page 358
		
		// Step 1: compute half the distance between the current
		// and final point.
		var dx2 = (x0 - x) / 2.0; var dy2 = (y0 - y)/2.0;
		
		// convert angle from degrees to radians
		var angleX = Math.PI * (angleX % 360.0) /180.0; 
		var cosXAngle = Math.cos(angleX);
		var sinXAngle = Math.sin(angleX);
		
		// Compute x1, y1
		var x1 = (cosXAngle * dx2 + sinXAngle * dy2);
		var y1 = (-sinXAngle * dx2 + cosXAngle * dy2);
		
		// Ensure radii are large enough
		rx = Math.abs(rx); ry = Math.abs(ry);
		var rxSq = rx * rx; var rySq = ry * ry;
		var x1Sq = x1 * x1; var y1Sq = y1 * y1;
		var radiiCheck = x1Sq / rxSq + y1Sq / rySq;
		if (radiiCheck > 1) {
			rx = Math.sqrt(radiiCheck) * rx;
			ry = Math.sqrt(radiiCheck) * ry;
			rxSq = rx * rx; rySq=ry*ry;
		
		}// Step 2: Compute (cx1, cy1)
		var sign = (largeArcFlag == sweepFlag)? -1 : 1;
		var sq = ((rxSq * rySq) - (rxSq*y1Sq) - (rySq * x1Sq)) /
			((rxSq * y1Sq) + (rySq * x1Sq));
		sq = (sq < 0)? 0: sq;
		var coefficient = (sign * Math.sqrt(sq));
		var cx1 = coefficient * ((rx * y1) / ry);
		var cy1 = coefficient * -((ry * x1) / rx);
		
		// Step 3 : Compute (cx, cy) from (cx1, cy1)
		var sx2 = (x0 + x) / 2.0;
		var sy2 = (y0 + y) / 2.0;
		var cx = sx2 + (cosXAngle * cx1 - sinXAngle * cy1);
		var cy = sy2 + (sinXAngle * cx1 + cosXAngle * cy1);

		// Step 4 : Compute the angleStart and the angleExtent
		var ux = (x1-cx1) / rx;
		var uy = (y1-cy1) / ry;
		var vx = (-x1-cx1) /rx; var vy = (-y1-cy1) / ry;
		
		// Compute the angle start
		var n = Math.sqrt((ux * ux) + (uy * uy));
		var p = ux;// (1 * ux) + (0 * uy)
		sign = (uy < 0)? -1.0 : 1.0;
		var angleStart = 180.0 * (sign * Math.acos(p / n)) / Math.PI;
		
		// Compute the angle extent
		n = Math.sqrt((ux * ux + uy * uy) * (vx * vx + vy * vy));
		p = ux * vx + uy * vy;
		sign = ((ux * vy - uy * vx) <0)? -1.0 : 1.0;
		var angleExtent = 180.0 * (sign * Math.acos(p / n)) / Math.PI;
		if ((!sweepFlag && angleExtent) > 0) { angleExtent -= 360.0; }
		else if (sweepFlag && angleExtent < 0) { angleExtent += 360.0; }
		angleExtent %= 360; angleStart %= 360;
		
		return new ArcSegment({ 
			center: new Vector(cx, cy), radius: new Vector(rx, ry),
			angleStart: angleStart, angleEnd: angleExtent, angleX: angleX
		});
	}
}

ShapeUtils.currentInitialPoint = null;
ShapeUtils.currentPoint = null;
ShapeUtils.currentPath = null;