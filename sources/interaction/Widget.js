/** Defines an Interaction Widget (a control element). */
class Widget {

	/** Initializes a new Widget Instance.
	 * @param name The name of the Widget.
	 * @param parent The parent of the Widget.
	 * @param {*} params The creation parameters of the Widget. */
	constructor(name, parent, params = {}) {

		// Check the name parameter
		this.name = name = name || "Widget";

		// Check the parent parameter (it can be layer or another widget)
		if (!parent) throw new Error("Invalid parent for Widget: " + this.name);
		this.parent = parent;

		// Set the type of the instance
		this.isWidget = true;

		// Check if the name is repeated in the parent and add it
		let widgetList = (parent.isWidget)? parent.children: parent.widgets;
		let copyNameIndex = 1;
		while (widgetList.includes(this.name)) this.name = name+copyNameIndex++;
		widgetList.push(this);

		// Set the transform vectors
		this.position = params.position || new Vector(0,0,0);
		this.rotation = params.rotation || new Vector(0,0,0);
		this.scale = params.scale || new Vector(1,1,1);
		this.size = params.size || new Vector(1,1,1);

		this.position.parent = this;
		this.rotation.parent = this;
		this.scale.parent = this;
		this.size.parent = this;

		// Create the representation and make it a child of its parent
		this.representation = new THREE.Object3D();
		this.representation.name = this.name;
		if (this.parent.isWidget) { 
			this.parent.representation.add(this.representation); 
		} else this.parent.space.representation.add(this.representation);

		// let test = new THREE.Mesh( new THREE.BoxBufferGeometry(1,1,1),
		// 	new THREE.MeshLambertMaterial());
		// this.representation.add(test);

		// Create the properties of the widget
		this.children = [];

		// Create the entities associated to the widget
		this.entities = [];

	}


	/** Creates a copy of the Widget.
	 * @param {*} newName The new name of the Widget.
	 * @param {*} newParent The new name of the Widget. */
	clone(newName, newParent) {
		return new Widget((newName)? newName : this.name, 
			newParent? newParent: this.parent, this);
	}


	/** Downdates the Widget. */
	downdate() { 
		// Make sure that the Widget is *already* updated
		if (!this.updated || this.parent == null) return;

		// Mark the widget as downdated
		this.updated = false; 

		// Downdate the parent
		if (this.parent && this.parent.downdate) this.parent.downdate();
	}


	/** Updates the Widget. */
	update() { 

		// Make sure that the Widget is *not* updated
		if (this.updated) return;

		// Apply the transformations
		let p = this.position, r = this.rotation, s = this.scale;
		if(!p.updated) { p.update();
			this.representation.position.set(p.x, p.y, p.z);
		}
		if(!r.updated) { r.update();
			this.representation.rotation.set(r.x * DEG_TO_RAD, 
			r.y * DEG_TO_RAD, r.z * DEG_TO_RAD);
		}
		if(!s.updated) { s.update(); 
			 this.representation.scale.set(s.x, s.y, s.z); }

		// Update the children
		let childIndex = 0, childCount = this.children.length;
		for (childIndex = 0; childIndex < childCount; childIndex++) {
			this.children[childIndex].update();
		}
		
		// Update the entities
		let entityIndex = 0, entityCount = this.entities.length;
		for (entityIndex = 0; entityIndex < entityCount; entityIndex++) {
			this.entities[entityIndex].update();
		}

		// Mark the widget as updated
		this.updated = true; 

		// Show a message on console
		// console.log("Widget Updated: " + this.name);
	}

}