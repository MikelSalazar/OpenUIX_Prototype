/** Defines an Entity of the Interaction Space. */
class Entity {

	/** Initializes a new Entity Instance.
	 * @param name The name of the Entity.
	 * @param parent The parent of the Entity.
	 * @param {*} params The creation parameters of the Entity. */
	constructor(name, parent, params = {}) {

		// Check the name and the parent
		if (!name) throw Error ("Undefined Entity name");
		// if (!parent) throw Error ("Undefined Entity parent");
		this.name = new Parameter("Name", this, {value: name});
		this.parent = new Parameter("Parent", this, {value: parent});

		// Set the type of the instance
		this.isEntity = true;
		
		// Define a variable to indicate if its updated
		this.updated = false;

		// The representation of the entity
		this.representation = params.representation || undefined;

		// Set the transform vectors
		this.position = params.position || new Vector(0,0,0);
		this.rotation = params.rotation || new Vector(0,0,0);
		this.position.parent = this; this.rotation.parent = this;

		this.entities = [];

		// It is important to add the parent, to ensure a proper connection
		if (parent) {
			if (parent.entities) parent.entities.push(this);
			if (parent.representation && this.representation) 
				parent.representation.add(this.representation);
		}
	}

	/** Downdates the Entity. */
	downdate() { 

		// Mark the ValuePoint as downdated
		this.updated = false;

		// Downdate the parent (or mark it as "not updated")
		if(this.parent.downdate) this.parent.downdate();
		else if(this.parent.updated) this.parent.updated = false;
	}

	/** Updates the Entity. */
	update() {

		// Make sure that the Entity is *not* updated
		if (this.updated) return;

		// Check the representation
		let representation = this.representation;
		if (representation) {

			// Apply the transformations
			let p = this.position, r = this.rotation;
			if (!p.updated) { p.update(); 
				this.representation.position.set(p.x, p.y, p.z); 
			}
			if (!r.updated) { r.update(); 
				this.representation.setRotationFromEuler(new THREE.Euler(
					r.x * DEG_TO_RAD, r.y * DEG_TO_RAD, r.z * DEG_TO_RAD));
			}

			if (!this.name.updated) representation.name = this.name.get();

			// Check the parent reference and its representation
			if (!this.parent.updated) {

				let parent = this.parent.update();

				if (parent && parent.entities) parent.entities.push(this);

				if (parent && parent.representation !== representation.parent) {
					parent.representation.add(representation);
				}
			}
		}
		else { this.name.updated = this.parent.updated = false; }	

		// Update the child entities
		this.entities.forEach(entity => { entity.update(); });

		// Mark the Entity as updated
		if (representation) this.updated = true; 

		// Show a message on console
		// console.log("Entity Updated: " + this.name);
	}

	/** Deletes the Entity. */
	delete() {

		// Check the representation
		let representation = this.representation;
		if (!representation) return;
		
		// Remove the representation from the hierarchy
		let parent = this.parent.get();
		if (parent && parent.representation == representation.parent) {
			parent.representation.remove(representation);
		}
	}
}