function KdTree(scene) {
	var maxNodeGeos = 5;
	var objs;
	var root;
	this.boundsHelper = [];
	var that = this;

	function Node(bounds) {
		this.bounds = bounds;
		this.childA;
		this.childB;
		this.objsIndex = [];

		var b = new THREE.Box3Helper(this.bounds);
		b.material.visible = false;
		that.boundsHelper.push(b);
		scene.add(b);
	}

	this.construct = function(objsPassed, bounds, scaleFactor) {
		objs = objsPassed;

		var objsIndex = [];
		for(var i = 0; i < objs.length; i++)
			objsIndex.push(i);

		root = new Node(bounds);
		constructNode(root, 0, objsIndex, [], scaleFactor);
	}

	function constructNode(node, level, objsIndex, crossOverObjsIndex, scaleFactor) {
		if(objsIndex.length <= maxNodeGeos) {
			node.objsIndex = objsIndex.concat(crossOverObjsIndex);
			return;
		}

		var dim = level % 3;
		var objsIndexSorted = objsIndex.slice().sort(compare(dim));
		var sep = getMedian(objsIndexSorted, dim);

        var maxA = node.bounds.max.clone();
		var minA = node.bounds.min.clone();
        minA.setComponent(dim, sep);

        var maxB = node.bounds.max.clone();
        var minB = node.bounds.min.clone();
		maxB.setComponent(dim, sep);
		
		node.childA = new Node(new THREE.Box3(minA, maxA));
		node.childB = new Node(new THREE.Box3(minB, maxB));
		
		var med = objsIndexSorted.length % 2 == 0 ? objsIndexSorted.length / 2 : (objsIndexSorted.length - 1) / 2;
		var objsIndexA = objsIndexSorted.slice(0, med);
		var potentialCrossOverObjsIndexA = objsIndexSorted.slice(med).concat(crossOverObjsIndex);
		var boundsA = node.childA.bounds.clone().expandByScalar(scaleFactor);
		var crossOverObjsIndexA = [];
		for(var i = 0; i < potentialCrossOverObjsIndexA.length; i++)
			if(boundsA.intersectsBox(objs[potentialCrossOverObjsIndexA[i]].bounds))
				crossOverObjsIndexA.push(potentialCrossOverObjsIndexA[i]);
		
		med = objsIndexSorted.length % 2 == 0 ? objsIndexSorted.length / 2 : (objsIndexSorted.length + 1) / 2;
		var objsIndexB = objsIndexSorted.slice(med);
		var potentialCrossOverObjsIndexB = objsIndexSorted.slice(0, med).concat(crossOverObjsIndex);
		var boundsB = node.childB.bounds.clone().expandByScalar(scaleFactor);
		var crossOverObjsIndexB = [];
		for(var i = 0; i < potentialCrossOverObjsIndexB.length; i++)
			if(boundsB.intersectsBox(objs[potentialCrossOverObjsIndexB[i]].bounds))
				crossOverObjsIndexB.push(potentialCrossOverObjsIndexB[i]);
		
		constructNode(node.childA, level + 1, objsIndexA, crossOverObjsIndexA);
		constructNode(node.childB, level + 1, objsIndexB, crossOverObjsIndexB);
	}

	function compare(dim) {
		return function(a, b) {
			var centerA = new THREE.Vector3();
			var centerB = new THREE.Vector3();
			objs[a].bounds.getCenter(centerA);
			objs[b].bounds.getCenter(centerB);
			var valA = centerA.getComponent(dim);
			var valB = centerB.getComponent(dim);
	
			if(valA < valB)
				return 1;
			if(valA > valB)
				return -1;
			else
				return 0;
		}
	}

	function getMedian(objsIndexSorted, dim) {
		if(objsIndexSorted.length % 2 == 0) {
			var med = objsIndexSorted.length / 2;
			var centerA = new THREE.Vector3();
			var centerB = new THREE.Vector3();
			objs[objsIndexSorted[med - 1]].bounds.getCenter(centerA);
			objs[objsIndexSorted[med]].bounds.getCenter(centerB);
			sep = (centerA[dim] + centerB[dim]) / 2;
			var center = centerA.add(centerB).multiplyScalar(0.5);
			return center.getComponent(dim);
		}
		else {
			var med = (objsIndexSorted.length - 1) / 2;
			var center = new THREE.Vector3();
			objs[objsIndexSorted[med]].bounds.getCenter(center);
			return center.getComponent(dim);
		}
	}

	this.retrieve = function(position) {
		return retrieveNode(root, position);
	}

	function retrieveNode(node, position) {
		if(node.objsIndex.length != 0)
			return node.objsIndex;

		if(node.childA.bounds.containsPoint(position))
			return retrieveNode(node.childA, position);
		else
			return retrieveNode(node.childB, position);
	}
}