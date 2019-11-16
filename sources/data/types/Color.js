/** Defines a Color. */
class Color {

	/** Initializes a new Color Instance.
	 * @param {*} r The red component of the Color.
	 * @param {*} g The green component of the Color.
	 * @param {*} b The blue component of the Color.
	 * @param {*} a The alpha component of the Color. */
	constructor(r = 0, g = 0, b = 0, a = 1) {
		this.r = r; this.g = g; this.b = b; this.a = a;
		this.isColor = true;
		this.updated = false;
		this.parent = null;
	}

	/** Updates the Color instance. */
	update() {
		if (!this.updated) this.updated = true; 
		if (this.parent && this.parent.update) this.parent.update();

		return new THREE.Color(this.r, this.g, this.b);
	}
}