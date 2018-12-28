var Collision = (function() {
    var EPA = function(aWorldVerts, bWorldVerts, simplex) {
        var simplexFaces = [{a: 0, b: 1, c: 2},
                            {a: 0, b: 1, c: 3},
                            {a: 0, b: 2, c: 3},
                            {a: 1, b: 2, c: 3}];
    
        var epsilon = 0.00001;
        var res = null;
    
        while(true) {
            var face = findClosestFace(simplex, simplexFaces);
            var point = support(aWorldVerts, bWorldVerts, face.norm);
            var dist = point.clone().dot(face.norm);
    
            if(dist - face.dist < epsilon) {
                res = {dir: face.norm.negate(), dist: dist + epsilon};
                break;
            }
    
            simplex.push(point);
            expand(simplex, simplexFaces, point);
        }
    
        return res;
    }
    
    var expand = function(simplex, simplexFaces, extendPoint) {
        //def can make all this more efficient
        var removalFaces = [];
        for(var i = 0; i < simplexFaces.length; i++) {
            var face = simplexFaces[i];
    
            var ab = simplex[face.b].clone().sub(simplex[face.a]);
            var ac = simplex[face.c].clone().sub(simplex[face.a]);
            var norm = ab.cross(ac).normalize();
    
            var a0 = new THREE.Vector3().sub(simplex[face.a]);
            if(a0.dot(norm) > 0)
                norm.negate();
    
            if(norm.clone().dot(extendPoint.clone().sub(simplex[face.a])) > 0)
                removalFaces.push(i);
        }
    
        var edges = [];
        for(var i = 0; i < removalFaces.length; i++) {
            var face = simplexFaces[removalFaces[i]];
            var edgeAB = {a: face.a, b: face.b};
            var edgeAC = {a: face.a, b: face.c};
            var edgeBC = {a: face.b, b: face.c};
    
            var k = edgeInEdges(edges, edgeAB);
            if(k != -1)
                edges.splice(k, 1);
            else
                edges.push(edgeAB);
    
            k = edgeInEdges(edges, edgeAC);
            if(k != -1)
                edges.splice(k, 1);
            else
                edges.push(edgeAC);
    
            k = edgeInEdges(edges, edgeBC);
            if(k != -1)
                edges.splice(k, 1);
            else
                edges.push(edgeBC);
        }
    
        for(var i = removalFaces.length - 1; i >= 0; i--) {
            simplexFaces.splice(removalFaces[i], 1);
        }
    
        for(var i = 0; i < edges.length; i++) {
            simplexFaces.push({a: edges[i].a, b: edges[i].b, c: simplex.length - 1});
        }
    }
    
    var edgeInEdges = function(edges, edge) {
        for(var i = 0; i < edges.length; i++)
            if(edges[i].a == edge.a && edges[i].b == edge.b)
                return i;
    
        return -1;
    }
    
    var findClosestFace = function(simplex, simplexFaces) {
        var closest = {dist: Infinity};
    
        for(var i = 0; i < simplexFaces.length; i++) {
            var face = simplexFaces[i];
    
            var ab = simplex[face.b].clone().sub(simplex[face.a]);
            var ac = simplex[face.c].clone().sub(simplex[face.a]);
            var norm = ab.cross(ac).normalize();
    
            var a0 = new THREE.Vector3().sub(simplex[face.a]);
            if(a0.dot(norm) > 0)
                norm.negate();
    
            var dist = simplex[face.a].clone().dot(norm);
            /*var distA = simplex[face.a].clone().dot(norm);
            var distB = simplex[face.b].clone().dot(norm);
            var distC = simplex[face.c].clone().dot(norm);
            var dist = Math.min(distA, distB, distC); //is this necessary?*/
    
            if(dist < closest.dist)
                closest = {index: i, dist: dist, norm: norm, a: face.a, b: face.b, c: face.c};
        }
    
        return closest;
    }

    var evaluateAndChangeDir = function(simplex, dir) {
        switch(simplex.length) {
            case 2:
                var ab = simplex[1].clone().sub(simplex[0]);
                var a0 = simplex[0].clone().negate();
                dir.copy(ab.clone().cross(a0).cross(ab));
    
                return false;
            case 3:
                var ab = simplex[1].clone().sub(simplex[0]);
                var ac = simplex[2].clone().sub(simplex[0]);
                dir.copy(ab.cross(ac));
    
                var a0 = simplex[0].clone().negate();
                if(a0.dot(dir) < 0)
                    dir.negate();
                
                return false;
            case 4:
                //face abc
                var ab = simplex[1].clone().sub(simplex[0]);
                var ac = simplex[2].clone().sub(simplex[0]);
                dir.copy(ab.cross(ac).normalize());
    
                var ad = simplex[3].clone().sub(simplex[0]);
                if(ad.dot(dir) > 0) {
                    dir.negate();
                }
                
                var a0 = simplex[0].clone().negate();
                if(a0.dot(dir) > 0) {
                    //remove d
                    simplex.splice(3, 1);
                    return false;
                }
    
                //face abd
                var ab = simplex[1].clone().sub(simplex[0]);
                var ad = simplex[3].clone().sub(simplex[0]);
                dir.copy(ab.cross(ad).normalize());
    
                var ac = simplex[2].clone().sub(simplex[0]);
                if(ac.dot(dir) > 0) {
                    dir.negate();
                }
    
                var a0 = simplex[0].clone().negate();
                if(a0.dot(dir) > 0) {
                    //remove c
                    simplex.splice(2, 1);
                    return false;
                }
    
                //face acd
                var ac = simplex[2].clone().sub(simplex[0]);
                var ad = simplex[3].clone().sub(simplex[0]);
                dir.copy(ac.cross(ad).normalize());
    
                var ab = simplex[1].clone().sub(simplex[0]);
                if(ab.dot(dir) > 0) {
                    dir.negate();
                }
    
                var a0 = simplex[0].clone().negate();
                if(a0.dot(dir) > 0) {
                    //remove b
                    simplex.splice(1, 1);
                    return false;
                }
    
                //face bcd
                var bc = simplex[2].clone().sub(simplex[1]);
                var bd = simplex[3].clone().sub(simplex[1]);
                dir.copy(bc.cross(bd).normalize());
    
                var ba = simplex[0].clone().sub(simplex[1]);
                if(ba.dot(dir) > 0) {
                    dir.negate();
                }
    
                var b0 = simplex[1].clone().negate();
                if(b0.dot(dir) > 0) {
                    //remove a
                    simplex.splice(0, 1);
                    return false;
                }
    
                //origin is in center
                return true;
        }
    }
    
    var convertVertsToWorldSpace = function(localVerts, object) {
        var worldVerts = [];
    
        for(var i = 0; i < localVerts.length; i++) {
            worldVerts.push(object.localToWorld(localVerts[i].clone()));
        }
    
        return worldVerts;
    }
    
    var support = function(aVerts, bVerts, dir) {
        a = getFurthestPointInDirection(aVerts, dir);
        b = getFurthestPointInDirection(bVerts, dir.clone().negate());
        return a.clone().sub(b);
    }
    
    var getFurthestPointInDirection = function(verts, dir) {
        var index = 0;
        var maxDot = -Infinity;
    
        for(var i = 0; i < verts.length; i++) {
            var dot = verts[i].clone().dot(dir);
    
            if(dot > maxDot) {
                maxDot = dot;
                index = i;
            }
        }
    
        return verts[index];
    }

    return {
        GJK: function(player, playerGeo, objectGeo, initDir) {
            //really should preprocess this information for all objects but its fine for now
            var aGeo = new THREE.Geometry().fromBufferGeometry(playerGeo);
            aGeo.mergeVertices();
            var bGeo = new THREE.Geometry().fromBufferGeometry(objectGeo);
            bGeo.mergeVertices();

            var aWorldVerts = convertVertsToWorldSpace(aGeo.vertices, player);
            var bWorldVerts = bGeo.vertices;

            var colliding = null;
            var simplex = [];
            var dir = initDir;

            simplex.push(support(aWorldVerts, bWorldVerts, dir));
            dir.negate();

            while(true) {
                var p = support(aWorldVerts, bWorldVerts, dir);
                simplex.push(p);

                if(p.clone().dot(dir) <= 0) {
                    colliding = false;
                    break;
                }

                if(evaluateAndChangeDir(simplex, dir)) {
                    colliding = true;
                    break;
                }
            }

            return colliding  ? EPA(aWorldVerts, bWorldVerts, simplex) : null;
        }
    };
})();