function PauseMenuState(gameManager) {
	State.call(this, gameManager);

	this.pauseMenu;
	this.resumeButton;
	this.optionsButton;

	this.onResumeButtonClicked;
	this.onOptionsButtonClicked;
}

PauseMenuState.prototype = Object.create(State.prototype);
PauseMenuState.prototype.constructor = State;

PauseMenuState.prototype.onEnter = function() {
	this.pauseMenu = document.getElementById("pauseMenu");
	this.pauseMenu.style.display = "block";

	this.resumeButton = pauseMenu.children[1];
	this.optionsButton = pauseMenu.children[2];

	var that = this;

	this.onResumeButtonClicked = function(event) {
		that.gameManager.popState();
		event.preventDefault();
		that.gameManager.canvas.focus();
	}

	this.onOptionsButtonClicked = function(event) {
		console.log("Options menu not implemented");
	}

	this.resumeButton.addEventListener("mousedown", this.onResumeButtonClicked);
	this.optionsButton.addEventListener("mousedown", this.onOptionsButtonClicked);
}

PauseMenuState.prototype.onExit = function() {
	this.resumeButton.removeEventListener("mousedown", this.onResumeButtonClicked);
	this.optionsButton.removeEventListener("mousedown", this.onOptionsButtonClicked);

	this.pauseMenu.style.display = "none";
}