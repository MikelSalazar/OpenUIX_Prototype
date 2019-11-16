/** Defines a Camera Entity. */
class Camera extends Entity {

	/** Initializes a new Camera Instance.
	 * @param name The name of the Camera.
	 * @param parent The parent of the Camera.
	 * @param {*} params The creation parameters of the Camera. */
	constructor(name, parent, params = {}) {

		// Call the parent class constructor
		super(name, parent, params);

		// Set the type of the instance
		this.isCamera = true;

		// Create the Camera parameters
		this.type = new Parameter("type", this, params.type || 'perspective');
		this.fov = new Parameter("fov", this, params.fov || 45);
		this.aspect = new Parameter("aspect", this, params.aspect || 1);
		this.width = new Parameter("width", this, params.width || 1);
		this.height = new Parameter("height", this, params.height || 1);
		this.near = new Parameter("near", this, params.near || 0.1);
		this.far = new Parameter("far", this, params.far || 2000);
	}


	/** Updates the Camera. */
	update() {

		// Make sure that the Camera is *not* updated
		if (this.updated) return;

		// Get the representation of the Camera
		let camera = this.representation;

		// Check if we have to update the entity
		switch (this.type.get()) {
			case 'perspective':
				if (!camera || !camera.isPerspectiveCamera) {
					camera =this.representation =new THREE.PerspectiveCamera();
				}
				camera.fov = this.fov.get();
				camera.aspect = this.aspect.get();
				camera.near = this.near.get();
				camera.far = this.far.get();
				break;
			case 'orthographic':
				if (!camera || !camera.isOrthographicCamera) {
					camera =this.representation =new THREE.OrthographicCamera();
				}
				camera.left = this.width.get() / -2.0;
				camera.right = this.width.get() / 2.0;
				camera.top = this.top.get() / 2.0;
				camera.bottom = this.bottom.get() / -2.0;
				camera.near = this.near.get();
				camera.far = this.far.get();
				break;
			default: throw new Error("Invalid camera type: " + this.type.get());
		}

		// Call the parent class
		super.update();

		// Update the projection matrix
		camera.updateProjectionMatrix();

		// Show a message on console
		// console.log("Camera Updated: " + this.name.get() + " "
		// 	+ this.position + " " + this.rotation );
	}
}
