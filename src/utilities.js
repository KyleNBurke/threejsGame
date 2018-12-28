function Utilities() {}

Utilities.clamp = function(n, min, max) {
	return Math.min(Math.max(n, min), max);
}

Utilities.lerp = function(start, end, t) {
	return start + (end - start) * Utilities.clamp(t, 0, 1);
}

Utilities.removeStaticKeyframeData = function(animations) {
	animations.forEach(function(clip) {
		for(var t = clip.tracks.length - 1; t >= 0; t--) {
			var track = clip.tracks[t];
			var static = true;
			var inc = track.name.split(".")[1] == "quaternion" ? 4 : 3;

			for(var i = 0; i < track.values.length - inc; i += inc) {
				for(var j = 0; j < inc; j++) {
					if(Math.abs(track.values[i + j] - track.values[i + j + inc]) > 0.000001) {
						static = false;
						//console.log("found change: " + clip.name + " -> " + track.name);
						break;
					}
				}

				if(!static)
					break;
			}

			if(static) {
				clip.tracks.splice(t, 1);
			}
		}
	});
}