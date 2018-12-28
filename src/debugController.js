function DebugController(gameManager, stage, player, camera) {
    var currTime = 0;
    var currFrames = 0;
    var freeCamToggle = false;
    var freeCamMoveFactor = 0.05;
    var freeCamRotationFactor = 0.001;
    var playerCollisionHullToggle = false;
    var environmentTreeToggle = false;
    var objectBoundsToggle = false;
    var terrainFaceBoundsToggle = false;

    this.update = function(timeStep) {
        currTime += timeStep;
	    currFrames++;

        if(currTime >= 1) {
            gameManager.fpsLabel.textContent = currFrames;
            currTime = 0;
            currFrames = 0;
        }

        if(Input.getInstance().isKeyPressed(49)) //1
            toggleFreeCam();

        if(Input.getInstance().isKeyPressed(50)) //2
            togglePlayerCollisionHull();
        
        if(Input.getInstance().isKeyPressed(51)) //3
            toggleEnvironmentTree();
        
        if(Input.getInstance().isKeyPressed(52)) //4
            toggleObjectBounds();
        
        if(Input.getInstance().isKeyPressed(53)) //5
            toggleTerrainFaceBounds();
        
        if(freeCamToggle) {
            var direction = new THREE.Vector3();

            if(Input.getInstance().isKeyHeld(87)) //W
			    direction.z -= 1;

		    if(Input.getInstance().isKeyHeld(83)) //S
			    direction.z += 1;

		    if(Input.getInstance().isKeyHeld(65)) //A
			    direction.x -= 1;

		    if(Input.getInstance().isKeyHeld(68)) //D
                direction.x += 1;

            if(Input.getInstance().isKeyHeld(81)) //Q
			    direction.y -= 1;

		    if(Input.getInstance().isKeyHeld(69)) //E
                direction.y += 1;

            var rotation = Input.getInstance().getMouseMovement();
                
            camera.translateZ(direction.z * freeCamMoveFactor);
            camera.translateX(direction.x * freeCamMoveFactor);
            camera.translateY(direction.y * freeCamMoveFactor);

            var quat = new THREE.Quaternion();
            quat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -rotation.x * freeCamRotationFactor);
            camera.quaternion.premultiply(quat);
            camera.rotateX(-rotation.y * freeCamRotationFactor);
        }
    }

    var toggleFreeCam = function() {
        freeCamToggle = !freeCamToggle;
        gameManager.freeCamLabel.textContent = freeCamToggle ? "ON" : "OFF";

        if(freeCamToggle)
            player.enterFreeCam();
        else
            player.exitFreeCam();
    }

    var togglePlayerCollisionHull = function() {
        playerCollisionHullToggle = !playerCollisionHullToggle;
        gameManager.playerCollisionHullLabel.textContent = playerCollisionHullToggle ? "ON" : "OFF";
        player.collisionMesh.material.visible = playerCollisionHullToggle;
    }

    var toggleEnvironmentTree = function() {
        environmentTreeToggle = !environmentTreeToggle;
        gameManager.environmentTreeLabel.textContent = environmentTreeToggle ? "ON" : "OFF";

        var bounds = stage.kdTree.boundsHelper;
        for(var i = 0; i < bounds.length; i++)
            bounds[i].material.visible = environmentTreeToggle;
    }

    var toggleObjectBounds = function() {
        objectBoundsToggle = !objectBoundsToggle;
        gameManager.objectBoundsLabel.textContent = objectBoundsToggle ? "ON" : "OFF";

        var bounds = stage.objectBoundsHelpers;
        for(var i = 0; i < bounds.length; i++)
            bounds[i].material.visible = objectBoundsToggle;
    }

    var toggleTerrainFaceBounds = function() {
        terrainFaceBoundsToggle = !terrainFaceBoundsToggle;
        gameManager.terrainFaceBoundsLabel.textContent = terrainFaceBoundsToggle ? "ON" : "OFF";

        var bounds = stage.terrainFaceBoundsHelpers;
        for(var i = 0; i < bounds.length; i++)
            bounds[i].material.visible = terrainFaceBoundsToggle;
    }
}