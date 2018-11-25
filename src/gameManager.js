function GameManager() {
	this.canvas = document.getElementById("canvas");
	this.canvas.focus();
	var width = this.canvas.getAttribute("width");
	var height = this.canvas.getAttribute("height");

	var renderer = new THREE.WebGLRenderer({canvas: canvas});
	renderer.setClearColor(0x6495ED);

	this.scene = new THREE.Scene();

	this.scene.add(new THREE.AxesHelper());

	this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 10000);
	this.scene.add(this.camera);

	this.fpsLabel = document.getElementById("fpsLabel");
	this.freeCamLabel = document.getElementById("freeCamLabel");
	this.boundingBoxesLabel = document.getElementById("boundingBoxesLabel");
	this.wireframesLabel = document.getElementById("wireframesLabel");
	this.octreeVisualizer = document.getElementById("octreeVisualizerLabel");

	var maxFPS = 120;
	var elapsedTime = 0;
	var lastTimeStamp = 0;

	var states = [];

	Input.getInstance().init(canvas);

	this.mainLoop = function(timeStamp) {
		var timeStep = 1000 / maxFPS;
		var updates = 0;

		if(timeStamp >= lastTimeStamp + timeStep) {
			elapsedTime += timeStamp - lastTimeStamp;
			lastTimeStamp = timeStamp;

			while(elapsedTime >= timeStep) {
				update(timeStep / 1000);

				elapsedTime -= timeStep;

				if(++updates >= 240) {
					elapsedTime = 0;
					break;
				}
			}

			renderer.render(this.scene, this.camera);
		}

		requestAnimationFrame(this.mainLoop.bind(this));
	}

	function update(timeStep) {
		//any states added or removed should be fine mid update iteration
		for(var i = 0; i < states.length; i++)
			if(states[i] instanceof UpdatableState && states[i].shouldUpdate)
				states[i].update(timeStep);

		Input.getInstance().reset();
	}

	this.addState = function(state) {
		if(states.length > 0)
			states[states.length - 1].onPause();

		states.push(state);
		state.onEnter();
	}


	this.popState = function() {
		states[states.length - 1].onExit();
		states.pop();

		if(states.length > 0)
			states[states.length - 1].onUnpause();
	}

	this.addState(new GameplayState(this));
}