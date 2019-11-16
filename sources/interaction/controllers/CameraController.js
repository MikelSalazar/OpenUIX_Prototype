/** Defines a Camera Controller. */
class CameraController extends Controller {

	/** Initializes a new CameraController Instance.
	 * @param layer The Layer associated to the Controller.
	 * @param {*} params The creation parameters of the Controller. */
	constructor (layer, params ={}) {

		// Call the parent class constructor
		super(layer, params);

		// Store the type of the class
		this.isThirdPersonController = true;

		// Define the parameters of the controller
		this.yaw = new Parameter("Yaw (Horizontal angle)", this, params.yaw);
		this.pitch = new Parameter("Pitch (Vertical Angle)", this,params.pitch);
		this.distance = new Parameter("Distance", this, params.distance, 20);
		this.speed = new Parameter("Rotation Speed", this, params.speed, 0.1)
		this.zoom = new Parameter("Zoom Speed", this, params.zoom, 0.01);

		this.touch = new Parameter("Touch Enabled", this, params.touch, true);
		this.mouse = new Parameter("Mouse Enabled", this, params.mouse, true);

		document.addEventListener('mousedown', this.startOrbit.bind(this), false);
		document.addEventListener('mousemove', this.updateOrbit.bind(this), false);
		document.addEventListener('wheel', this.updateOrbit.bind(this), false);
		document.addEventListener('mouseup', this.endOrbit.bind(this), false);
	
		document.addEventListener('touchstart', this.startOrbit.bind(this), false);
		document.addEventListener('touchmove', this.updateOrbit.bind(this), false);
		document.addEventListener('touchend', this.endOrbit.bind(this), false);
	}

	startOrbit(event) {
		// If its a touch event, use the first touch as the event
		if (event.type == "touchstart") event = event.touches[0];
		this.dragCursor = new Vector(event.pageX, event.pageY);
		this.dragYaw = this.yaw.get(); this.dragPitch = this.pitch.get();
		this.touchSeparation = null;
	}

	updateOrbit(event) {

		// Get the current values
		let distance = this.distance.get(),
			yaw = this.yaw.get(),
			pitch = this.pitch.get(),
			speed = this.speed.get(),
			zoom = this.zoom.get(),
			rotating = false,
			x = 0, y = 0, zoomDelta = 0;

		// Check if it is a touch event
		if (this.touch.get() && event.type == "touchmove") {

			// Store the data of the touches
			let touches = event.touches, touchCount = touches.length;

			switch (touchCount) {
				case 1: 
					rotating = true;
					x = touches[0].pageX; y = touches[0].pageY; 
					break;
				case 2: 
					// Disable the drag operation
					this.dragCursor = null

					// Calculate the zoom by separation
					let t0 = touches[0], t1 = touches[1],
						p0X = t0.pageX, p0Y = t0.pageY,
						p1X = t1.pageX, p1Y = t1.pageY,
						pX = p0X - p1X, pY = p0Y - p1Y,
						separation = Math.sqrt(((pX * pX) + (pY * pY)));

					if (this.touchSeparation) {
						zoomDelta = (this.touchSeparation - separation) * 0.4;
					} 
					this.touchSeparation = separation;
					break;
			}
		}

		// Check if it is a mouse event
		if (this.mouse.get()){
			switch (event.type) {
				case "mousemove": 
					rotating = (event.buttons == 1);
					x = event.pageX; y = event.pageY; 
				break;
				case "wheel": 
				zoomDelta = event.deltaY;
				break;
			}
		}

		// Check if the user is rotating the camera
		if (rotating == true && this.dragCursor) {
			yaw = (x - this.dragCursor.x) * -speed + this.dragYaw;
			pitch = (y - this.dragCursor.y) * speed + this.dragPitch;
			this.yaw.set(yaw); this.pitch.set(pitch);
		}
		
		// Check if the user is  the camera
		if (zoomDelta) {
			distance += zoomDelta * zoom;
			this.distance.set(distance);
		}
	}

	endOrbit(e) {
		this.dragCursor = null;
	}

	
	/** Updates the Controller. */
	update() {

		// Make sure that the Camera is *not* updated
		if (this.updated) return;

		let distance = this.distance.get(),
			yaw = this.yaw.get(), yawRad = yaw * DEG_TO_RAD,
			pitch = this.pitch.get(), pitchRad = pitch * DEG_TO_RAD;

		let x = Math.sin(yawRad) * distance,
			y = Math.cos(yawRad) * Math.sin(pitchRad) * distance,
			z = Math.cos(yawRad) * Math.cos(pitchRad) * distance;

		// Update the camera
		let camera = this.layer.camera;
		camera.position.setX(x);
		camera.position.setY(y);
		camera.position.setZ(z);
		camera.rotation.setY(yaw);
		camera.rotation.setX(-pitch);
		camera.updated = false;

		// Mark the controller as updated
		this.updated = true; 

		// Show a message on console
		// console.log("ThirdPersonController Updated: "
		// 	+ yaw.toFixed(2) + ", " + pitch.toFixed(2) + " " 
		// 	// + camera.position.toString()
		// 	);
	}
}