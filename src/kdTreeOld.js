function KdTreeOld(scene) {
    var faces = [];
    var rootSize = 16;
    var root;
    var dimArr = ["x", "y", "z"];
    var maxNodeFaces = 4;

    var retrievedFaceNormals = [];

    function Node(bounds) {
        this.bounds = bounds;
        this.childA;
        this.childB;
        this.faces = [];

        var bb = new THREE.Box3Helper(this.bounds);
        scene.add(bb);
    }

    this.construct = function(geometry) {
        var posAttr = geometry.getAttribute("position");

        for(var i = 0; i < posAttr.count; i += 3) {
            var a = new THREE.Vector3(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
            var b = new THREE.Vector3(posAttr.getX(i + 1), posAttr.getY(i + 1), posAttr.getZ(i + 1));
            var c = new THREE.Vector3(posAttr.getX(i + 2), posAttr.getY(i + 2), posAttr.getZ(i + 2));
            //console.log(new THREE.Triangle(a, b, c).getMidpoint(new THREE.Vector3()));

            faces.push(new THREE.Triangle(a, b, c));
        }
        //console.log(faces);

        //we should make the bounds of the root, the actual bounds of the terrain obj
        var min = new THREE.Vector3(-rootSize, -rootSize, -rootSize);
        var max = new THREE.Vector3(rootSize, rootSize, rootSize);
        root = new Node(new THREE.Box3(min, max));

        var facesIndex = [];
        for(var i = 0; i < faces.length; i++)
            facesIndex.push(i);

        constructNode(root, 0, facesIndex, []);
    }

    function constructNode(node, level, nodeFaces, crossOverFaces) {
        if(nodeFaces.length <= maxNodeFaces) {
            node.faces = nodeFaces.slice().concat(crossOverFaces);
            return;
        }

        var dim = dimArr[level % 3];
        var facesSorted = nodeFaces.slice().sort(compare(dim));
        var sep = getMedian(facesSorted)[dim];

        var minA = node.bounds.min.clone();
        var maxA = node.bounds.max.clone();
        minA[dim] = sep;

        var minB = node.bounds.min.clone();
        var maxB = node.bounds.max.clone();
        maxB[dim] = sep;

        node.childA = new Node(new THREE.Box3(minA, maxA));
        node.childB = new Node(new THREE.Box3(minB, maxB));
        //scale the child bounds by half the size of the player collision mesh bounds on appropriate axis

        var divA = facesSorted.length % 2 == 0 ? facesSorted.length / 2 : (facesSorted.length - 1) / 2;
        var facesA = facesSorted.slice(0, divA);
        var potentialCrossOverFacesA = facesSorted.slice(divA).concat(crossOverFaces);
        var crossOverFacesA = [];
        for(var i = 0; i < potentialCrossOverFacesA.length; i++)
            if(node.childA.bounds.intersectsTriangle(faces[potentialCrossOverFacesA[i]]))
                crossOverFacesA.push(potentialCrossOverFacesA[i]);
        
        var divB = facesSorted.length % 2 == 0 ? facesSorted.length / 2 : (facesSorted.length + 1) / 2;
        var facesB = facesSorted.slice(divB);
        var potentialCrossOverFacesB = facesSorted.slice(0, divB).concat(crossOverFaces);
        var crossOverFacesB = [];
        for(var i = 0; i < potentialCrossOverFacesB.length; i++)
            if(node.childB.bounds.intersectsTriangle(faces[potentialCrossOverFacesB[i]]))
                crossOverFacesB.push(potentialCrossOverFacesB[i]);
        
        constructNode(node.childA, level + 1, facesA, crossOverFacesA);
        constructNode(node.childB, level + 1, facesB, crossOverFacesB);
    }

    function compare(dim) {
        return function(a, b) {
            var midA = new THREE.Vector3();
            var midACoord = faces[a].getMidpoint(midA)[dim];
            var midB = new THREE.Vector3();
            var midBCoord = faces[b].getMidpoint(midB)[dim];
    
            if(midACoord < midBCoord)
                return 1;
            if(midACoord > midBCoord)
                return -1;
            else
                return 0;
        }
    }

    function getMedian(nodeFacesSorted) {
        if(nodeFacesSorted.length % 2 == 0) {
            var med = nodeFacesSorted.length / 2;
            var midA = new THREE.Vector3();
            faces[nodeFacesSorted[med - 1]].getMidpoint(midA);
            var midB = new THREE.Vector3();
            faces[nodeFacesSorted[med]].getMidpoint(midB);

            return midA.add(midB).multiplyScalar(0.5);
        }
        else {
            var med = (nodeFacesSorted.length - 1) / 2;
            var mid = new THREE.Vector3();

            return faces[nodeFacesSorted[med]].getMidpoint(mid);
        }
    }

    this.retrieve = function(position) {
        var res = retrieveNode(root, position);
        
        if(res.dup) {
            //remove duplicate faces
        }

        for(var i = 0; i < retrievedFaceNormals.length; i++) {
            scene.remove(retrievedFaceNormals[i]);
        }

        retrievedFaceNormals = [];
        for(var i = 0; i < res.faces.length; i++) {
            var f = faces[res.faces[i]];
            var dir = new THREE.Vector3();
            f.getNormal(dir);
            var mid = new THREE.Vector3();
            f.getMidpoint(mid);
            var arrow = new THREE.ArrowHelper(dir, mid);
            retrievedFaceNormals.push(arrow);
            scene.add(arrow);
        }

        return res.faces;
    }

    function retrieveNode(node, position) {
        if(node.faces.length != 0) {
            return { dup: false, faces: node.faces }
        }

        var a = node.childA.bounds.containsPoint(position);
        var b = node.childB.bounds.containsPoint(position);

        //can we avoid this case if we do the node bounds scaling thing?
        //if we scale it right when we can account for the player being right on the edge
        //then we could just pretend that the player is in A
        if(a && b) {
            var facesA = retrieveNode(node.childA, position).faces;
            var facesB = retrieveNode(node.childB, position).faces;
            console.log('in');
            return { dup: true, faces: facesA.concat(facesB) };
        }
        else if(a) {
            return retrieveNode(node.childA, position);
        }
        else {
            return retrieveNode(node.childB, position);
        }
    }
}