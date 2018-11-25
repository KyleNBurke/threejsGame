function Octree(scene) {
	var maxObjects = 8;
	var maxLevels = 5;
	var size = 128;
	var that = this;
	this.boundingBoxes = [];
	//public so I can see the structure from printing the octree
	this.root = new Node(0, new THREE.Vector3(-size / 2, -size / 2, -size / 2), size);

	function Node(level, position, size) {
		this.level = level;
		this.bounds = new THREE.Box3(position, position.clone().addScalar(size))
		this.childNodes = [];
		this.objects = [];
		
		var bb = new THREE.Box3Helper(this.bounds, new THREE.Color("red"));
		bb.material.visible = false;
		that.boundingBoxes.push(bb);
		scene.add(bb);
	}

	this.clear = function() {
		console.log("clear not implemented");
	}

	function split(node) {
		var min = node.bounds.min;
		var size = (node.bounds.max.x - min.x) / 2;

		//bottom
		node.childNodes.push(new Node(node.level + 1, new THREE.Vector3(min.x, min.y, min.z), size));
		node.childNodes.push(new Node(node.level + 1, new THREE.Vector3(min.x + size, min.y, min.z), size));
		node.childNodes.push(new Node(node.level + 1, new THREE.Vector3(min.x, min.y, min.z + size), size));
		node.childNodes.push(new Node(node.level + 1, new THREE.Vector3(min.x + size, min.y, min.z + size), size));

		//top
		node.childNodes.push(new Node(node.level + 1, new THREE.Vector3(min.x, min.y + size, min.z), size));
		node.childNodes.push(new Node(node.level + 1, new THREE.Vector3(min.x + size, min.y + size, min.z), size));
		node.childNodes.push(new Node(node.level + 1, new THREE.Vector3(min.x, min.y + size, min.z + size), size));
		node.childNodes.push(new Node(node.level + 1, new THREE.Vector3(min.x + size, min.y + size, min.z + size), size));
	}

	function getOctant(node, object) {
		var objectBounds = new THREE.Box3().setFromObject(object);

		for(var i = 0; i < 8; i++)
			if(node.childNodes[i].bounds.containsBox(objectBounds))
				return i;
		
		return -1;
	}

	function getOctantIntersectionList(node, object) {
		var objectBounds = new THREE.Box3().setFromObject(object);
		var list = [];

		for(var i = 0; i < 8; i++)
			if(node.childNodes[i].bounds.intersectsBox(objectBounds))
				list.push(i);
		
		return list;
	}

	this.insert = function(object) {
		insert(this.root, object);
	}

	function insert(node, object) {
		if(node.childNodes.length == 0) {
			node.objects.push(object);

			if(node.objects.length > maxObjects && node.level < maxLevels) {
				split(node);

				var i = 0;
				while(i < node.objects.length) {
					var octant = getOctant(node, node.objects[i]);

					if(octant != -1)
						insert(node.childNodes[octant], node.objects.splice(i, 1)[0]);
					else
						i++;
				}
			}
		}
		else {
			var octant = getOctant(node, object);

			if(octant == -1)
				node.objects.push(object);
			else
				insert(node.childNodes[octant], object);
		}
	}

	this.retrieve = function(box) {
		return retrieve(this.root, box);
	}

	function retrieve(node, object) {
		if(node.childNodes.length == 0)
			return node.objects;

		var octantList = getOctantIntersectionList(node, object);

		var list = [];
		for(var i = 0; i < octantList.length; i++)
			list = list.concat(node.objects.concat(retrieve(node.childNodes[octantList[i]], object)));

		return list;
	}
}