function GameManager() {
	this.canvas = document.getElementById("canvas");
	var width = window.innerWidth;//this.canvas.getAttribute("width");
	var height = window.innerHeight;//this.canvas.getAttribute("height");
	this.canvas.width = width;
	this.canvas.height = height;
	this.canvas.focus();
	var renderer = new THREE.WebGLRenderer({canvas: canvas});
	renderer.setClearColor(0x6495ED);
	this.scene = new THREE.Scene();
	this.scene.add(new THREE.AxesHelper());
	this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 10000);
	this.scene.add(this.camera);
	var that = this;

	this.freeCamLabel = document.getElementById("freeCamLabel");
	this.playerCollisionHullLabel = document.getElementById("playerCollisionHullLabel");
	this.environmentTreeLabel = document.getElementById("environmentTreeLabel");
	this.objectBoundsLabel = document.getElementById("objectBoundsLabel");
	this.terrainFaceBoundsLabel = document.getElementById("terrainFaceBoundsLabel");

	var stats = new Stats();
	document.body.appendChild(stats.dom);
	stats.dom.id = "stats";
	stats.dom.style = null;
	stats.showPanel(0);

	var maxFPS = 120;
	var elapsedTime = 0;
	var lastTimeStamp = 0;

	var states = [];

	Input.getInstance().init(canvas);

	this.mainLoop = function(timeStamp) {
		var timeStep = 1000 / maxFPS;
		var updates = 0;

		if(timeStamp >= lastTimeStamp + timeStep) {
			stats.begin();
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
			stats.end();
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

	function onResize() {
		that.canvas.width = window.innerWidth;
		that.canvas.height = window.innerHeight;

		renderer.setSize(that.canvas.width, that.canvas.height);
		that.camera.aspect = that.canvas.width / that.canvas.height;
		that.camera.updateProjectionMatrix();
	}

	window.addEventListener("resize", onResize);
	this.addState(new GameplayState(this));
}