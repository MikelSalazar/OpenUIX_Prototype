/** Defines an Interaction Space. */
class Space {
	
	/** Initializes a new Space Instance.
	 * @param name The name of the Space.
	 * @param {*} params The creation parameters of the Space. */
	constructor(name, params = {}) {
		
		// Store the type of the instance
		this.isSpace = true;

		// Check the name
		this.name = name || "Space";

		// Create the representation of the Space
		this.representation = new THREE.Scene();

		// The child entities
		this.entities = [];

		// Adds the generator to the global list
		Space.instances.push(this);
	}


	/** Updates the Space. */
	update() {

		// Update the child entities
		let entityIndex = 0, entityCount = this.entities.length;
		for (entityIndex = 0; entityIndex < entityCount; entityIndex++) {
			this.entities[entityIndex].update();
		}
	}
	
}

/** The global list of Interaction Spaces. */
Space.instances = [];