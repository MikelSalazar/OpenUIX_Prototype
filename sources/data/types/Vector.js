/** Defines a multidimensional Vector. */
class Vector {

	/** Initializes a new Vector Instance. */
	constructor(values) {
		this.values = [];
		this.isVector = true;
		this.updated = false;
		this.dimensions = 2;
		this.parent = null;
		let argIndex = 0, argCount = arguments.length;
		for (argIndex = 0; argIndex < argCount; argIndex++) {
			this.setAt(argIndex, arguments[argIndex]);
		}
	}


	/** Creates a copy of the Widget Instance. */
	clone() { 
		let copy = new Vector(); 
		for (let valueIndex =0; valueIndex < this.values.length; valueIndex++) {
			copy.setAt(valueIndex, this.values[valueIndex]);
		}

		copy.parent = this.parent;
		return copy;
	}


	/** Gets the values of the Vector.
	 * @param {*} dimensions The dimensionality of the returning array
	 * @returns An array with the values of the vector. */
	get(dimensions = -1) { 
		let values = [], valueIndex, size = this.values.length;
		if (dimensions < 0) dimensions = size;
		for (valueIndex= 0; valueIndex < dimensions; valueIndex++) {
			values.push((valueIndex < size)? this.values[valueIndex] : 0);
		}
		return values;
	}


	/** Gets the first value of the vector Instance.
	 * @returns The value to set. */
	getX() { return this.getAt(0); }


	/** Gets the second value of the vector Instance.
	 * @returns The value to set. */
	getY() { return this.getAt(1); }


	/** Gets the third value of the vector Instance.
	 * @returns The third value of the vector. */
	getZ() { return this.getAt(2); }


	/** Get a specific value of a vector.
	 * @param {*} index The index value. */
	getAt(index) { 
		return ((index < this.values.length)? this.values[index]: 0);
	}


	/** Sets the values of the vector Instance.*/
	set() {
		let argIndex = 0, argCount = arguments.length;
		for (argIndex =0; argIndex < argCount; argIndex++) {
			this.setAt(argIndex, arguments[argIndex]);
		}
	 }

	 
	/** Sets the first value of the vector Instance.
	 * @param value The value to set. */
	setX(value) { this.setAt(0, value); }


	/** Sets the second value of the vector Instance.
	 * @param value The value to set. */
	setY(value) { this.setAt(1, value); }


	/** Sets the third value of the vector Instance.
	 * @param value The value to set. */
	setZ(value) { this.setAt(2, value); }


	/** Sets a value of the vector Instance.
	 * @param index The index of the value to set. 
	 * @param value The value to set. */
	setAt(index, value) {
		if (isNaN(value) || !isFinite(value)){
			throw new Error("Invalid value: " + value)
		}
		this.values[index] = value;
		if (index == 0) this.x = value;
		else if (index == 1) this.y = value;
		else if (index == 2) this.z = value;
		this.updated = false;
		this.dimensions = this.values.length;
		if (this.parent) this.parent.updated = false;
	 }


	/** Updates the Vector instance. */
	update() { if (!this.updated) this.updated = true; }


	/** Obtains a string representation of the Vector instance.
	 * @digits The number of digits after the decimal point.
	 * @returns A string representation of the Vector instance. */
	toString(digits = 2) { 
		let valueString = "";
		this.values.forEach((value, index) => {
			valueString += ((index>0)? ", " : "") + value.toFixed(digits);
		});
		return '{' + valueString + '}';
	}
	

	/** Compares two Vector instances
	 * @param v1 The first Vector instance.
	 * @param v2 The second Vector instance.
	 * @returns A boolean value with the comparison result. */
	static equals(v1, v2) {
		if (!v1 || !v2) return false;
		if (v1.values.length !== v2.values.length) return false;
		let s = 0.00001; // Sigma value required
		for (let valueIndex = 0; valueIndex < v1.values.length; valueIndex++) {
			if (v1.values[valueIndex] + s < v2.values[valueIndex]) return false;
			if (v1.values[valueIndex] - s > v2.values[valueIndex]) return false;
		}
		return true;
	}
}
