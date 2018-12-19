function Stage(scene) {
	this.objects = [];
	this.boundingBoxes = [];
	this.octree = new Octree(scene);

	var loader = new THREE.OBJLoader();
	var terrainHeightMap = [];
	var terrainDist;
	var terrainCount;
	var that = this;

	this.load = function(path) {
		loader.load(path, function(group) {
			var terrainFound = false;
			that.objects = group.children;

			for(var i = 0; i < group.children.length; i++) {
				var obj = group.children[i];

				if(obj.name.split("_")[0] == "terrain") {
					terrainFound = true;
					processTerrain(obj);
					continue;
				}

				that.octree.insert(obj);

				var bb = new THREE.BoxHelper(group.children[i]);
				bb.material.visible = false;
				that.boundingBoxes.push(bb);
				scene.add(bb);
			}

			scene.add(group);

			if(!terrainFound)
				console.warn("No terrain found, ensure mesh name is \"terrain\"");

			//console.log(that.octree);
		});
	}

	this.update = function() {
		//might not need this function
		//this could be for like any objects that need to be updated due to foces applied to them once
		//I've implemented rigid body physics
	}

	var processTerrain = function(obj) {
		var posAttr = obj.geometry.getAttribute("position");
		terrainCount = Math.sqrt(posAttr.count / 6);
		terrainDist = Math.round(posAttr.getX(1)) - Math.round(posAttr.getX(0));
		
		if(terrainCount % 2 != 0) {
			console.error("Terrain tile count must be even");
			return;
		}

		for(var i = 0; i < posAttr.count; i++) {
			var x = Math.round(posAttr.getX(i));
			var y = Math.round(posAttr.getY(i));
			var z = Math.round(posAttr.getZ(i));
			var xArr = x / terrainDist + terrainCount / 2;
			var yArr = z / terrainDist + terrainCount / 2;

			if(terrainHeightMap[xArr] == undefined)
				terrainHeightMap[xArr] = [];

			terrainHeightMap[xArr][yArr] = y;
		}
	}

	this.getTerrainSurface = function(position) {
		var offX = Math.abs(position.x) > terrainCount / 2 * terrainDist;
		var offY = Math.abs(position.z) > terrainCount / 2 * terrainDist;
		if(terrainHeightMap.length == 0 || offX || offY)
		return { height: 0, normal: new THREE.Vector3(0, 1, 0) };

		var x = Math.floor(position.x / terrainDist);
		var y = Math.floor(position.z / terrainDist);
		var xArr = x + terrainCount / 2;
		var yArr = y + terrainCount / 2;
		var xRem = position.x % terrainDist;
		var yRem = position.z % terrainDist;
		if(xRem < 0)
			xRem += terrainDist;
		if(yRem < 0)
			yRem += terrainDist;

		var a = new THREE.Vector3(x * terrainDist, terrainHeightMap[xArr][yArr], y * terrainDist);
		var c = new THREE.Vector3((x + 1) * terrainDist, terrainHeightMap[xArr + 1][yArr + 1], (y + 1) * terrainDist);
		var b;
		if(yRem > xRem)
			b = new THREE.Vector3(x * terrainDist, terrainHeightMap[xArr][yArr + 1], (y + 1) * terrainDist);
		else
			b = new THREE.Vector3((x + 1) * terrainDist, terrainHeightMap[xArr + 1][yArr], y * terrainDist);

		var denom = (b.z - c.z) * (a.x - c.x) + (c.x - b.x) * (a.z - c.z);
		var w1 = ((b.z - c.z) * (position.x - c.x) + (c.x - b.x) * (position.z - c.z)) / denom;
		var w2 = ((c.z - a.z) * (position.x - c.x) + (a.x - c.x) * (position.z - c.z)) / denom;
		var w3 = 1 - w1 - w2;

		var height = w1 * a.y + w2 * b.y + w3 * c.y;
		var normal = new THREE.Vector3();
		new THREE.Triangle(a, b, c).getNormal(normal);
		if(normal.clone().dot(new THREE.Vector3(0, 1, 0)) < 0)
			normal.negate();

		return { height: height, normal: normal };
	}
}