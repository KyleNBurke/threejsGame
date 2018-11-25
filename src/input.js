var Input = (function() {
	var instance;

	function Singleton() {
		var heldKeys = [];
		var pressedKeys = [];
		var validPress = [];
		var mouseMovementX = 0;
		var mouseMovementY = 0;
		var mouseMovementScroll = 0;

		this.init = function(canvas) {
			for(var i = 0; i < 254; i++)
				validPress.push(true);

			canvas.addEventListener("keydown", onKeyDown);
			canvas.addEventListener("keyup", onKeyUp);
			canvas.addEventListener("mousemove", onMouseMove);
			canvas.addEventListener("mousewheel", onMouseScroll);
		}

		this.reset = function() {
			pressedKeys = [];
			mouseMovementX = 0;
			mouseMovementY = 0;
			mouseMovementScroll = 0;
		}

		function onKeyDown(event) {
			heldKeys[event.keyCode] = true;

			if(validPress[event.keyCode]) {
				pressedKeys[event.keyCode] = true;
				validPress[event.keyCode] = false;
			}
		}

		function onKeyUp(event) {
			heldKeys[event.keyCode] = false;
			pressedKeys[event.keyCode] = false;
			validPress[event.keyCode] = true;
		}

		this.isKeyHeld = function(keyCode) {
			return heldKeys[keyCode];
		}

		this.isKeyPressed = function(keyCode) {
			return pressedKeys[keyCode];
		}

		function onMouseMove(event) {
			//Google chrome bug
			if(Math.abs(event.movementX) > 500 || Math.abs(event.movementY) > 100) {
				mouseMovementX = 0;
				mouseMovementY = 0;
				return;
			}

			mouseMovementX = event.movementX;
			mouseMovementY = event.movementY;
		}

		this.getMouseMovement = function() {
			return { x: mouseMovementX, y: mouseMovementY };
		}

		function onMouseScroll(event) {
			mouseMovementScroll = event.wheelDeltaY;
		}

		this.getMouseScroll = function() {
			return mouseMovementScroll;
		}
	}

	return {
		getInstance: function() {
			if(instance == null) {
				instance = new Singleton();
				instance.constructor = null;
			}

			return instance;
		}
	};
})();