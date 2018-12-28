function Stage(scene) {
	this.objects = [];
	var loader = new THREE.OBJLoader();
	this.kdTree = new KdTree(scene);
	this.objectBoundsHelpers = [];
	this.terrainFaceBoundsHelpers = [];
	var that = this;

	this.load = function(path) {
		loader.load(path, function(group) {
			var groupBounds = new THREE.Box3().setFromObject(group);

			for(var i = 0; i < group.children.length; i++) {
				var obj = group.children[i];

				if(obj.name.split("_")[0] == "terrain") {
					obj.material = new THREE.MeshLambertMaterial({side: THREE.DoubleSide});
					that.objects = that.objects.concat(processTerrain(obj));
					continue;
				}
				
				obj.material = new THREE.MeshLambertMaterial();
				var bounds = new THREE.Box3().setFromObject(obj);
				that.objects.push({geo: obj.geometry, bounds: bounds});

				var boundsHelper = new THREE.Box3Helper(bounds);
				boundsHelper.material.visible = false;
				that.objectBoundsHelpers.push(boundsHelper);
				scene.add(boundsHelper);
			}

			//this is hard coded as the max player collision hull size on each axis
			//this is trival to get but I had trouble referencing the player.collisionMesh due to
			//the player loading being asyncronous
			var scaleFactor = 2.3;
			that.kdTree.construct(that.objects, groupBounds, scaleFactor);
			scene.add(group);
		});
	}

	function processTerrain(terrain) {
		var objs = [];
		var posAttr = terrain.geometry.getAttribute("position");
		var normAttr = terrain.geometry.getAttribute("normal");

		for(var i = 0; i < posAttr.array.length; i += 9) {
			var geo = new THREE.BufferGeometry();
			var verts = posAttr.array.slice(i, i + 9);
			var norms = normAttr.array.slice(i, i + 9);
			geo.addAttribute("position", new THREE.BufferAttribute(verts, 3));
			geo.addAttribute("normal", new THREE.BufferAttribute(norms, 3));
			var bounds = new THREE.Box3().setFromBufferAttribute(geo.getAttribute("position"));
			objs.push({geo: geo, bounds: bounds});

			var boundsHelper = new THREE.Box3Helper(bounds.clone().expandByScalar(0.00001));
			boundsHelper.material.visible = false;
			that.terrainFaceBoundsHelpers.push(boundsHelper);
			scene.add(boundsHelper);
		}
		
		return objs;
	}

	this.update = function() {
		//might not need this function
		//this could be for like any objects that need to be updated due to foces applied to them once
		//I've implemented rigid body physics
	}

	this.getCollisionObjsIndex = function(position) {
		return this.kdTree.retrieve(position);
	}
}