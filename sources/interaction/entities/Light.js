/** Defines a Light Entity. */
class Light extends Entity {

	/** Initializes a new Light Instance.
	 * @param name The name of the Light.
	 * @param parent The parent of the Light.
	 * @param {*} params The creation parameters of the Light. */
	constructor(name, parent, params = {}) {

		// Call the parent class constructor
		super(name, parent, params);

		// Set the type of the instance
		this.isLight = true;

		// Create the Light parameters
		this.type = new Parameter("type", this, params.type || 'directional');
		this.color = new Parameter("color", this, params.color || 0xFFFFFF);
		this.intensity = new Parameter("intensity", this, params.intensity || 1);
		this.distance = new Parameter("distance", this, params.distance || 0);
		this.decay = new Parameter("decay", this, params.decay || 1);
		this.angle = new Parameter("angle", this, params.angle || Math.PI/3);
		this.penumbra = new Parameter("penumbra", this, params.penumbra || 0);
	}


	/** Updates the Light. */
	update() {

		// Make sure that the Light is *not* updated
		if (this.updated) return;

		// Get the representation of the Light
		let light = this.representation;

		// Check if we have to update the entity
		switch (this.type.get()) {
			case 'ambient':
				if (!light || !light.isAmbientLight) {
					light = this.representation = new THREE.AmbientLight();
				}
				light.color = new THREE.Color(this.color.get());
				light.intensity = this.intensity.get();
				break;
			case 'point':
				if (!light || !light.isPointLight) {
					light = this.representation = new THREE.PointLight();
				}
				light.color = new THREE.Color(this.color.get());
				light.intensity = this.intensity.get();
				light.distance = this.distance.get();
				light.decay = this.decay.get();
				break;
			case 'spot':
				if (!light || !light.isSpotLight) {
					light = this.representation = new THREE.SpotLight();
				}
				light.color = new THREE.Color(this.color.get());
				light.intensity = this.intensity.get();
				light.distance = this.distance.get();
				light.decay = this.decay.get();
				light.angle = this.angle.get();
				light.penumbra = this.penumbra.get();
				break;
			case 'directional':
				if (!light || !light.isDirectionalLight) {
					light = this.representation = new THREE.DirectionalLight();
				}
				light.color = new THREE.Color(this.color.get());
				light.intensity = this.intensity.get();
				break;
			case 'hemisphere':
				if (!light || !light.isHemisphereLight) {
					light = this.representation = new THREE.HemisphereLight();
				}
				light.color = new THREE.Color(this.color.get());
				light.groundColor = new THREE.Color(this.color.get());
				light.intensity = this.intensity.get();
				break;
			default: throw new Error("Invalid camera type: " + this.type.get());
		}

		// Call the parent class
		super.update();

		// Show a message on console
		// console.log("Light Updated: " + this.name.get() + " "
		// 	+ this.position + " " + this.rotation );
	}
}
