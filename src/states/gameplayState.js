function GameplayState(gameManager) {
	UpdatableState.call(this, gameManager);
}

GameplayState.prototype = Object.create(UpdatableState.prototype);
GameplayState.prototype.constructor = UpdatableState;

GameplayState.prototype.onEnter = function() {
	var ambientLight = new THREE.AmbientLight(0x404040);
	this.gameManager.scene.add(ambientLight);

	var pointLight = new THREE.PointLight(0x404040);
	pointLight.position.y = 5;
	this.gameManager.scene.add(pointLight);

	var floorGeo = new THREE.PlaneGeometry(100, 100, 10, 10);
	var floorMat = new THREE.MeshLambertMaterial({color: 0xdddacc});
	var floorMesh = new THREE.Mesh(floorGeo, floorMat);
	floorMesh.rotation.x = -Math.PI / 2;
	//this.gameManager.scene.add(floorMesh);

	//load stage
	this.stage = new Stage(this.gameManager.scene);
	this.stage.load("res/stages/terrain1.obj");
	
	this.player = new Player(this.gameManager.scene, this.gameManager.camera, this.stage);

	this.debugController = new DebugController(this.gameManager, this.stage, this.player, this.gameManager.camera);

	var that = this;

	document.addEventListener("pointerlockchange", onPointerLockChange);

	pause();

	var shouldPause = false;
	function onPointerLockChange() {
		if(shouldPause)
			pause();

		shouldPause = !shouldPause;
	}

	function pause() {
		that.gameManager.addState(new PauseMenuState(that.gameManager));
	}
}

GameplayState.prototype.onExit = function() {
}

GameplayState.prototype.onPause = function() {
	UpdatableState.prototype.onPause.call(this);
}

GameplayState.prototype.onUnpause = function() {
	UpdatableState.prototype.onUnpause.call(this);
	this.gameManager.canvas.requestPointerLock();
}

GameplayState.prototype.update = function(timeStep) {
	this.player.update(timeStep);
	this.stage.update();
	this.debugController.update(timeStep);
}