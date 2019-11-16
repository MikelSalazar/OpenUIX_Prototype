/** Defines a data parameter. */
class Parameter {

	/** Initializes a new Parameter Instance.
	 * @param name The name of the Parameter.
	 * @param parent The parent of the Parameter.
	 * @param params The creation parameters of the Parameter
	 * @param defaultValue The default Value */
	constructor(name, parent, params = {}, defaultValue = 0) {

		// Check the name parameter
		this.name = name || "Parameter";

		// Check the parent parameter
		this.parent = parent;

		// Check the creation parameters
		if (typeof params == "object") {
			if (params.isSource) params = { source: params };
		} else { params = { value: params }; }
		this.value = params.value; this.defaultValue = defaultValue;
		if (this.value == null || this.value == undefined) {
			this.value = defaultValue;
		}

		this.minValue = params.minValue || undefined;
		this.maxValue = params.maxValue || undefined;
		this.source = params.source || undefined;
		this.offset = params.offset || undefined;
		this.factor = params.factor || undefined;

		// Create the fields of the Parameter
		this.updated = false;
		this.isParameter = true;

		if(this.source) {
			this.source.linkedParameters.push(this);
			console.log("Linked " + name + " to " + this.source.name);
		} 
	}


	/** Create a copy of the Parameter.
	 * @param {*} newName The new name of the Parameter.
	 * @param {*} newParent The new parent of the Parameter. */
	clone(newName, newParent) {
		return new Parameter((newName)? newName : this.name, 
			newParent? newParent: this.parent, this);
	}


	/** Get the value of the Parameter.
	 * @returns The current value of the Parameter. */
	get() { return this.update(); }


	/** Set the value of the Parameter.
	 * @param The new value of the Parameter. */
	set(newValue) { 
		if (this.factor !== undefined) newValue *= this.factor;
		if (this.offset !== undefined) newValue += this.offset;
		if (this.minValue !== undefined && newValue < this.minValue) {
			console.log("Parameter " + 
				((this.parent.name)? this.parent.name + "." : "") +
				this.name + " Minimum Value Reached:" + this.minValue)
			newValue = this.minValue;
		}
		if (this.maxValue !== undefined && newValue > this.maxValue) {
			console.log("Parameter " + 
				((this.parent.name)? this.parent.name + "." : "") +
				this.name + " Maximum Value Reached:" + this.maxValue)
			newValue = this.maxValue;
		}
		this.value = newValue; this.downdate();
	}


	/** Downdates the Parameter. */
	downdate() {

		// Make sure that the ValuePoint is *already* updated
		if (!this.updated) return;

		// Mark the ValuePoint as downdated
		this.updated = false; 

		// Downdate the parent (or mark it as "not updated")
		if(this.parent.downdate) this.parent.downdate();
		else if(this.parent.updated) this.parent.updated = false;

		// if (this.source) {
		// 	console.log("Downdating from source");
		// }
	}


	/** Updates the Parameter. */
	update() {

		// If there is a data source, check that first
		if (this.source && this.value !== this.source.value) {
			this.set(this.source.value);
		}

		// Make sure that the Parameter is *not* updated
		if (this.updated) return this.value;

		// Mark the Parameter as updated
		this.updated = true; 

		// Return the value
		return this.value;
	 }


	 /** Gets a string representation of the Parameter.
	  * @returns A string representation of the Parameter. */
	 toString() { return this.value; }
}