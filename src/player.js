function Player(scene, camera, stage) {
	var material = new THREE.MeshLambertMaterial({color: "green", skinning: true});
	var loader = new THREE.FBXLoader();
	var meshGroup;
	var mixer;
	var actionFadeFactor = 0.3;
	var idleAction;
	var crossFadingToIdle = false;
	var walkAction;
	var crossFadingToWalk = false;
	var torsoControlBone;
	var torsoRotationFrameCount = 3;
	var pelvisBone;
	var pelvisRotationCurr = 0;
	var pelvisRotationStart;
	var pelvisRotationEnd;
	var pelvisRotationTime;
	var pelvisRotationTimeFactor = 4;
	var shouldResetLerp = false;
	var sphericalPos = new THREE.Spherical(5, Math.PI / 3, Math.PI);
	var rotationFactor = 0.001;
	var zoomFactor = 0.005;
	var cameraOffset = new THREE.Vector3(0.7, 1, 1);
	var position = new THREE.Vector3();
	var velocity = new THREE.Vector3();
	var gravityVelocity = 0;
	var maxSpeed = 500;
	var acceleration = 0.6;
	var deceleration = 0.9;
	var jumpVelociy = 17;
	var gravity = 0.5;
	var update = true;
	var collisionMesh = new THREE.Mesh(new THREE.BoxGeometry(0.7, 2.2, 0.7), new THREE.MeshBasicMaterial({color: "yellow", wireframe: true, visible: true}));
	var surfaceNormal = new THREE.Vector3(0, 1, 0);

	this.enterFreeCam = function() {
		update = false;
		var pos = camera.getWorldPosition(new THREE.Vector3());
		var quat = camera.getWorldQuaternion(new THREE.Quaternion());
		torsoControlBone.remove(camera);
		camera.position.copy(pos);
		camera.quaternion.copy(quat);
		camera.scale.setX(1);
	}

	this.exitFreeCam = function() {
		update = true;
		torsoControlBone.add(camera);
		camera.scale.setX(-1);
		updateCamera();
	}

	loader.load("res/player/player2.fbx", function(object) {
		//console.log(object);
		meshGroup = object;

		Utilities.removeStaticKeyframeData(meshGroup.animations);

		meshGroup.children[0].material = material;

		mixer = new THREE.AnimationMixer(meshGroup);
		idleAction = mixer.clipAction(THREE.AnimationClip.findByName(object.animations, "armatureMesh|idle"));
		idleAction.setDuration(7);
		idleAction.enabled = true;
		idleAction.play();

		walkAction = mixer.clipAction(THREE.AnimationClip.findByName(object.animations, "armatureMesh|walk"));
		walkAction.setDuration(1.5);
		walkAction.enabled = false;
		walkAction.play();

		torsoControlBone = meshGroup.children[0].skeleton.bones[0];
		camera.scale.setX(-1);
		torsoControlBone.add(camera);
		pelvisBone = meshGroup.children[0].skeleton.bones[7];

		updateCamera();

		meshGroup.add(collisionMesh);
		collisionMesh.translateY(1.15);
		
		scene.add(meshGroup);
	});

	this.update = function(timeStep) {
		if(!update)
			return;

		//mouse move
		var mouseMovement = Input.getInstance().getMouseMovement();
		if(mouseMovement.x != 0 || mouseMovement.y != 0) {
			var rotationX = mouseMovement.x * rotationFactor;
			var rotationY = -mouseMovement.y * rotationFactor;

			torsoControlBone.rotateY(rotationX);

			if(Math.abs(torsoControlBone.rotation.y) > Math.PI / 3) {
				torsoControlBone.rotation.y = Math.sign(torsoControlBone.rotation.y) * Math.PI / 3;
				meshGroup.rotateY(-rotationX);
				torsoRotationFrameCount = 0;
			}
			
			sphericalPos.phi += rotationY;

			if(sphericalPos.phi < 0.01)
				sphericalPos.phi = 0.01;

			if(sphericalPos.phi > Math.PI)
				sphericalPos.phi = Math.PI;

			updateCamera();
		}

		//mouse scroll
		var mouseScrollAmount = Input.getInstance().getMouseScroll();
		if(mouseScrollAmount != 0) {
			sphericalPos.radius -= mouseScrollAmount * zoomFactor;

			if(sphericalPos.radius < 0.1)
				sphericalPos.radius = 0.1;

			updateCamera();
		}

		var direction = new THREE.Vector3();

		if(Input.getInstance().isKeyHeld(87)) //W
			direction.z += 1;

		if(Input.getInstance().isKeyHeld(83)) //S
			direction.z += -1;

		if(Input.getInstance().isKeyHeld(65)) //A
			direction.x += 1;

		if(Input.getInstance().isKeyHeld(68)) //D
			direction.x += -1;

		if(Input.getInstance().isKeyPressed(32)) { //space
			gravityVelocity = jumpVelociy;
		}

		if(direction.length() != 0) {
			direction.normalize();
			var torsoPelvisRotDiff = torsoControlBone.rotation.y + pelvisBone.rotation.y;
			var pRot = pelvisBone.rotation.y;
			meshGroup.rotateY(-torsoControlBone.rotation.y);
			torsoControlBone.rotation.y = 0;

			if(shouldResetLerp) {
				shouldResetLerp = false;
				pelvisBone.rotation.y = torsoPelvisRotDiff;
				pelvisRotationCurr = pelvisBone.rotation.y;
				pelvisRotationStart = pelvisRotationCurr;
				pelvisRotationTime = 0;
			}

			if(direction.z >= 0) {
				pelvisRotationLerpTo(Math.atan2(direction.z, -direction.x) - Math.PI / 2);
				walkAction.setEffectiveTimeScale(1);
			}
			else {
				pelvisRotationLerpTo(Math.atan2(-direction.z, direction.x) - Math.PI / 2);
				walkAction.setEffectiveTimeScale(-1);
			}

			crossFadeToWalk();
		}
		else {
			shouldResetLerp = true;
			pelvisRotationLerpTo(0);

			if(torsoRotationFrameCount <= 2)
				crossFadeToWalk();
			else
				crossFadeToIdle();
		}

		pelvisRotationCurr = Utilities.lerp(pelvisRotationStart, pelvisRotationEnd, pelvisRotationTime);
		pelvisRotationTime += timeStep * pelvisRotationTimeFactor * (Math.PI / Math.abs(pelvisRotationEnd - pelvisRotationStart));
		pelvisBone.rotation.y = pelvisRotationCurr;

		if(torsoRotationFrameCount <= 2)
			torsoRotationFrameCount++;
		
		var length = velocity.length();
		velocity.projectOnPlane(surfaceNormal).setLength(length);

		direction.projectOnPlane(surfaceNormal).normalize();
		velocity.add(direction.multiplyScalar(acceleration)).multiplyScalar(deceleration);
		gravityVelocity -= gravity;

		//isn't even necessary?
		//velocity.x = Utilities.clamp(velocity.x, -1, 1);
		//velocity.z = Utilities.clamp(velocity.z, -1, 1);

		//if(Math.abs(velocity.x) < 0.0001)
		//	velocity.x = 0;
		//if(Math.abs(velocity.z) < 0.0001)
		//	velocity.z = 0;

		meshGroup.translateX(velocity.x * timeStep);
		meshGroup.translateY((velocity.y + gravityVelocity) * timeStep);
		meshGroup.translateZ(velocity.z * timeStep);

		mixer.update(timeStep);
		//boxHelper.update();

		meshGroup.updateMatrixWorld();
		resolveCollisions();
	}

	function resolveCollisions() {
		surfaceNormal = new THREE.Vector3(0, 1, 0);
		var colliding = false;

		var collisionMeshBounds = new THREE.Box3().setFromObject(collisionMesh);
		var gameObjects = stage.octree.retrieve(meshGroup);
		collisionMesh.material.color.set("yellow");

		for(var i = 0; i < gameObjects.length; i++) {
			var gameObjectBounds = new THREE.Box3().setFromObject(gameObjects[i]);
			if(collisionMeshBounds.intersectsBox(gameObjectBounds)) {
				var res = Utilities.GJK(collisionMesh, gameObjects[i], scene);
				
				if(res != null) {
					collisionMesh.material.color.set("red");
					colliding = true;
					var up = new THREE.Vector3(0, 1, 0);
					
					if(res.dir.clone().negate().dot(up) >= 0.7) { //walkable
						var resUp = up.clone().setLength(res.dist / Math.cos(up.clone().dot(res.dir)));
						meshGroup.position.add(resUp);
						meshGroup.updateMatrixWorld();

						surfaceNormal = res.dir.clone().negate();
						var quat = new THREE.Quaternion();
						meshGroup.getWorldQuaternion(quat);
						surfaceNormal.applyQuaternion(quat.inverse());

						gravityVelocity = -gravity;
					}
					else {
						meshGroup.position.sub(res.dir.clone().multiplyScalar(res.dist));
						meshGroup.updateMatrixWorld();

						var quat = new THREE.Quaternion();
						meshGroup.getWorldQuaternion(quat);
						res.dir.negate().applyQuaternion(quat.inverse());
						velocity.projectOnPlane(res.dir);
					}
				}
			}
		}

		//this code is now wrong with the implementation of walkable/non-walkable surfaces
		var terrainHeight = 0; //stage.getTerrainHeight(meshGroup.position);
		if(meshGroup.position.y < terrainHeight) {
			meshGroup.position.y = terrainHeight;
			//velocity.y = 0; //configure for ground sliding? like wall sliding, might help stutter
			gravityVelocity = 0;
		}
	}

	var pelvisRotationLerpTo = function(pelvisRotationEndNew) {
		if(pelvisRotationEndNew == pelvisRotationEnd)
			return;

		pelvisRotationEnd = pelvisRotationEndNew;
		pelvisRotationStart = pelvisRotationCurr;
		pelvisRotationTime = 0;
	}

	function updateCamera() {
		camera.position.setFromSpherical(sphericalPos);
		camera.lookAt(new THREE.Vector3(0, 0, 0));
		camera.position.add(cameraOffset);
	}

	function crossFadeToWalk() {
		crossFadingToIdle = false;
		if(crossFadingToWalk)
			return;

		crossFadingToWalk = true;

		idleAction.stopFading();
		walkAction.stopFading();

		walkAction.enabled = true;

		var idleActionWeight = idleAction.getEffectiveWeight();
		idleAction._scheduleFading(actionFadeFactor * idleActionWeight, idleActionWeight, 0);

		var walkActionWeight =  walkAction.getEffectiveWeight();
		walkAction._scheduleFading(actionFadeFactor * (1 - walkActionWeight), walkActionWeight, 1);
	}

	function crossFadeToIdle() {
		crossFadingToWalk = false;
		if(crossFadingToIdle)
			return;
		
		crossFadingToIdle = true;

		idleAction.stopFading();
		walkAction.stopFading();

		idleAction.enabled = true;

		var idleActionWeight = idleAction.getEffectiveWeight();
		idleAction._scheduleFading(actionFadeFactor * (1 - idleActionWeight), idleActionWeight, 1);

		var walkActionWeight =  walkAction.getEffectiveWeight();
		walkAction._scheduleFading(actionFadeFactor * walkActionWeight, walkActionWeight, 0);
	}
}