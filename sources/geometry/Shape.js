/** Defines a Geometric Shape. */
class Shape {

	/** Initializes a new Shape Instance.
	 * @param {*} name The name of the Shape.
	 * @param {*} parent The parent of the Shape.
	 * @param {*} params The creation parameters of the Shape. */
	constructor(name, parent, params = {}) {

		// Check the given parameters
		this.name = name || "[Shape]";
		this.parent = parent;

		// Store the type of the class
		this.isShape = true;

		// Indicates if the Shape is updated (or needs to be updated)
		this.updated = false;

		// Check the creation parameters
		this.color = params.color || new Color(1, 1, 1, 1);
		this.materialType = new Parameter("MaterialType", this,
			params.materialType || 'lambert');
		this.materialSide = new Parameter("MaterialSide", this,
			params.materialSide || 'front');
		this.debug = params.debug || false;
		this.materialWireframe = params.materialWireframe || true;
		this.vertexBufferSize = 0; this.indexBufferSize = 0;

		// Copy the modifiers
		this.modifiers = [];
		if (params.modifiers) this.modifiers = [...params.modifiers];

		// Create the transformations
		this.position = params.position || new Vector(0, 0, 0);
		this.rotation = params.rotation || new Vector(0, 0, 0);
		this.scale = params.scale || new Vector(1, 1, 1);
		this.position.parent = this;
		this.rotation.parent = this; 
		this.scale.parent = this; 

		// Create the ThreeJS Mesh associated with this Shape
		this.geometry = new THREE.BufferGeometry();
		this.geometry.setAttribute('position', 
			new THREE.Float32BufferAttribute(this.vertexBufferSize, 3));
		this.geometry.setAttribute('normal', 
			new THREE.Float32BufferAttribute(this.vertexBufferSize, 3));

		this.material = new THREE.MeshPhongMaterial();
		this.mesh = new THREE.Mesh(this.geometry, this.material);
		this.mesh.name = this.name;
	}


	/** Create a copy of the Shape.
	* @param {*} newName The name of the Shape copy.
	* @param {*} newParent The parent 3DObject of the Shape copy. */
	clone(newName, newParent) {
		return new Shape( (newName)? newName : this.name + "Copy",
			(newParent)? newParent : this.parent, this);
	}


	/** Downdates the Shape. */
	downdate() { 

		// Mark the ValuePoint as downdated
		this.updated = false;

		// Downdate the parent (or mark it as "not updated")
		if(this.parent.downdate) this.parent.downdate();
		else if(this.parent.updated) this.parent.updated = false;
		// console.log("Shape Changed: " + this.name);
	}

	
	/** Updates the Shape.
	 * @param {*} forced Indicates whether to force the update or not. */
	update(forced) {

		// Check if the Shape must be updated
		if(this.updated && !forced) return;

		// Apply the transformations
		let p = this.position, r = this.rotation, s = this.scale;
		if (!p.updated) {
			p.update(); this.mesh.position.set(p.getX(), p.getY(), p.getZ());
		}
		if (!r.updated) { r.update(); this.mesh.setRotationFromEuler(
			new THREE.Euler(r.x*RAD_TO_DEG, r.y*RAD_TO_DEG, r.z*RAD_TO_DEG)); }
		if (!s.updated) { s.update(); this.mesh.scale.set(s.x, s.y, s.z); }
	
		// If there is no geometry, create an "X" to symbolize an error
		let geometry = this.geometry;
		if (this.vertexBufferSize < 0) {
			let vertexData = new THREE.Float32BufferAttribute([
				0.0,  0.2, 0,	-0.2,  0.0, 0,	 0.0, -0.2, 0,
				0.0, -0.2, 0,	 0.2,  0.0, 0,	 0.0,  0.2, 0,
				0.0,  0.2, 0,	-0.8,  1.0, 0,	-1.0,  0.8, 0,
				-1.0,  0.8, 0,	-0.2,  0.0, 0,	 0.0,  0.2, 0,
				-0.2,  0.0, 0,	-1.0, -0.8, 0,	-0.8, -1.0, 0,
				-0.8, -1.0, 0,	 0.0, -0.2, 0,	-0.2,  0.0, 0,
				0.0, -0.2, 0,	 0.8, -1.0, 0,	 1.0, -0.8, 0,
				1.0, -0.8, 0,	 0.2,  0.0, 0,	 0.0, -0.2, 0,
				0.2,  0.0, 0,	 1.0,  0.8, 0,	 0.8,  1.0, 0,
				0.8,  1.0, 0,	 0.0,  0.2, 0,	 0.2,  0.0, 0,

				0.0,  0.2, 0,	 0.0, -0.2, 0,	-0.2,  0.0, 0,
				0.0, -0.2, 0,	 0.0,  0.2, 0,	 0.2,  0.0, 0,
				0.0,  0.2, 0,	-1.0,  0.8, 0,	-0.8,  1.0, 0,
				-1.0,  0.8, 0,	 0.0,  0.2, 0,	-0.2,  0.0, 0,
				-0.2,  0.0, 0,	-0.8, -1.0, 0,	-1.0, -0.8, 0,
				-0.8, -1.0, 0,	-0.2,  0.0, 0,	 0.0, -0.2, 0,
				0.0, -0.2, 0,	 1.0, -0.8, 0,	 0.8, -1.0, 0,
				1.0, -0.8, 0,	 0.0, -0.2, 0,	 0.2,  0.0, 0,
				0.2,  0.0, 0,	 0.8,  1.0, 0,	 1.0,  0.8, 0,
				0.8,  1.0, 0,	 0.2,  0.0, 0,	 0.0,  0.2, 0,
			],3);
			this.vertexBufferSize = vertexData.length;
			geometry.setAttribute('position', vertexData);
			geometry.boundingSphere = new THREE.Sphere(0,2);
			geometry.attributes.position.needsUpdate = true;
			geometry.verticesNeedUpdate = true;
			this.materialType.set('basic'); this.color = new Color(1,0,0);
		}


		// Check the material type
		let updatedMaterial = !this.materialType.updated || 
							!this.materialSide.updated;
		if (updatedMaterial) {
			switch (this.materialType.update()) {
				case 'basic': 
					this.material = new THREE.MeshBasicMaterial(); break;
				case 'lambert':
					this.material = new THREE.MeshLambertMaterial(); break;
				case 'phong':
					this.material = new THREE.MeshPhongMaterial(); break;
				case 'pbr':
					this.material = new THREE.MeshStandardMaterial(); break;
				case 'toon':
					this.material = new THREE.MeshToonMaterial(); break;
				default: throw new Error ('Invalid material type for shape "' +
					this.name + '". Valid options are:' +
					 ' "basic", "phong", "lambert", "pbr" or "toon"' );
			}
			this.mesh.material = this.material;

			switch (this.materialSide.update()) {
				case 'front': 
					this.material.side = THREE.FontSide; break;
				case 'back':
					this.material.side = THREE.BackSide; break;
				case 'double':
					this.material.side = THREE.DoubleSide; break;
			}
		}

		// Check the material color
		if (updatedMaterial || !this.color.updated) {
			this.material.color = this.color.update();
			this.material.opacity = this.color.a;
			this.material.transparent = (this.color.a < 1);
		}

		// Mark the shape as updated
		this.updated = true;

		// Show a message on console
		// console.log("Shape Updated: " + this.name);
	}
}