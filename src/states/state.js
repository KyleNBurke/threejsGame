function State(gameManager) {
	this.gameManager = gameManager;
}

State.prototype.onEnter = function() {}
State.prototype.onExit = function() {}

State.prototype.onPause = function() {}
State.prototype.onUnpause = function() {}


function UpdatableState(gameManager) {
	State.call(this, gameManager);
	this.shouldUpdate = true;
}

UpdatableState.prototype = Object.create(State.prototype);
UpdatableState.prototype.constructor = State;

UpdatableState.prototype.onPause = function() {
	this.shouldUpdate = false;
}

UpdatableState.prototype.onUnpause = function() {
	this.shouldUpdate = true;
}

UpdatableState.prototype.update = function(timeStep) {}