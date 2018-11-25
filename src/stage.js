function Stage(scene) {
	this.objects = [];
	this.boundingBoxes = [];
	this.octree = new Octree(scene);

	//var loader = new THREE.FBXLoader();
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
		var posArr = obj.geometry.attributes.position.array;
		terrainCount = Math.sqrt(posArr.length / 18);

		var minX = Math.round(posArr[0]);
		var maxX = Math.round(posArr[0]);
		for(var i = 3; i < posArr.length; i += 3) {
			minX = Math.min(minX, Math.round(posArr[i]));
			maxX = Math.max(maxX, Math.round(posArr[i]));
		}

		terrainDist = (maxX - minX) / terrainCount;

		for(var i = 0; i < posArr.length; i += 3) {
			var x = Math.round(posArr[i]);
			var y = Math.round(posArr[i + 1]);
			var z = Math.round(posArr[i + 2]);
			var xArr = x / terrainDist + terrainCount / 2;
			var yArr = z / terrainDist + terrainCount / 2;

			if(terrainHeightMap[xArr] == undefined)
				terrainHeightMap[xArr] = [];

			terrainHeightMap[xArr][yArr] = y;
		}

		//console.log(terrainHeightMap);
	}

	this.getTerrainHeight = function(position) {
		if(terrainHeightMap.length == 0)
			return 0;

		var x = Math.ceil(position.x / terrainDist);
		var y = Math.ceil(position.z / terrainDist);
		var xArr = x + terrainCount / (terrainCount / 2);
		var yArr = y + terrainCount / (terrainCount / 2);
		var diagHeight = position.x + (y - x) * terrainDist;

		var a = [x * terrainDist, terrainHeightMap[xArr][yArr], y * terrainDist];
		var c = [(x - 1) * terrainDist, terrainHeightMap[xArr - 1][yArr - 1], (y - 1) * terrainDist];
		var b;

		if(position.z >= diagHeight)
			b = [(x - 1) * terrainDist, terrainHeightMap[xArr - 1][yArr], y * terrainDist];
		else
			b = [x * terrainDist, terrainHeightMap[xArr][yArr - 1], (y - 1) * terrainDist];
	
		var denom = (b[2] - c[2]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[2] - c[2]);
		var w1 = ((b[2] - c[2]) * (position.x - c[0]) + (c[0] - b[0]) * (position.z - c[2])) / denom;
		var w2 = ((c[2] - a[2]) * (position.x - c[0]) + (a[0] - c[0]) * (position.z - c[2])) / denom;
		var w3 = 1 - w1 - w2;

		return w1 * a[1] + w2 * b[1] + w3 * c[1];
	}
}