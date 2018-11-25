function DebugController(gameManager, stage, player, camera) {
    var currTime = 0;
    var currFrames = 0;
    var freeCamToggle = false;
    var freeCamMoveFactor = 0.05;
    var freeCamRotationFactor = 0.001;
    var boundingBoxesToggle = false;
    var wireframesToggle = false;
    var octreeVisualizer = false;

    this.update = function(timeStep) {
        currTime += timeStep;
	    currFrames++;

        if(currTime >= 1) {
            gameManager.fpsLabel.textContent = currFrames;
            currTime = 0;
            currFrames = 0;
        }

        if(Input.getInstance().isKeyPressed(49/*98*/)) //NUMPAD 3
            toggleFreeCam();

        if(Input.getInstance().isKeyPressed(50/*99*/)) //NUMPAD 3
            toggleBoundingBoxes();
        
        if(Input.getInstance().isKeyPressed(51/*100*/)) //NUMPAD 4
            toggleWireframe();

        if(Input.getInstance().isKeyPressed(52/*101*/)) //NUMPAD 5
            toggleOctreeVisualizer();
        
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

    var toggleBoundingBoxes = function() {
        boundingBoxesToggle = !boundingBoxesToggle;

        gameManager.boundingBoxesLabel.textContent = boundingBoxesToggle ? "ON" : "OFF";

        for(var i = 0; i < stage.boundingBoxes.length; i++)
            stage.boundingBoxes[i].material.visible = boundingBoxesToggle;
    }

    var toggleWireframe = function() {
        wireframesToggle = !wireframesToggle;

        gameManager.wireframesLabel.textContent = wireframesToggle ? "ON" : "OFF";

        for(var i = 0; i < stage.objects.length; i++)
            stage.objects[i].material.wireframe = wireframesToggle;
    }

    var toggleOctreeVisualizer = function() {
        octreeVisualizer = !octreeVisualizer;

        gameManager.octreeVisualizer.textContent = octreeVisualizer ? "ON" : "OFF";

        for(var i = 0; i < stage.octree.boundingBoxes.length; i++)
            stage.octree.boundingBoxes[i].material.visible = octreeVisualizer;
    }
}