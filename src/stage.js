function Stage(scene) {
	this.objects = [];
	this.boundingBoxes = [];
	this.octree = new Octree(scene);
	this.terrainKdTree = new KdTree(scene);
	var loader = new THREE.OBJLoader();
	var that = this;

	this.load = function(path) {
		loader.load(path, function(group) {
			var terrainFound = false;
			that.objects = group.children;

			for(var i = 0; i < group.children.length; i++) {
				var obj = group.children[i];

				if(obj.name.split("_")[0] == "terrain") {
					terrainFound = true;
					that.terrainKdTree.construct(obj.geometry);
					continue;
				}

				that.octree.insert(obj);

				var bb = new THREE.BoxHelper(group.children[i]);
				bb.material.visible = false;
				that.boundingBoxes.push(bb);
				scene.add(bb);
			}

			scene.add(group);

			//that.terrainKdTree.retrieve(new THREE.Vector3());

			if(!terrainFound)
				console.warn("No terrain found, ensure mesh name is \"terrain\"");
		});
	}

	this.update = function() {
		//might not need this function
		//this could be for like any objects that need to be updated due to foces applied to them once
		//I've implemented rigid body physics
	}
}