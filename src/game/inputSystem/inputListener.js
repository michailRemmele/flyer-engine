class InputListener {
  constructor(window) {
    this.window = window;
    this.queue = [];
  }

  startListen(keys) {
    this.window.onkeydown = (event) => {
      if (keys.indexOf(event.keyCode) !== -1) {
        this.queue.push(event.keyCode);
      }
    };
  }

  stopListen() {
    this.window.onkeydown = null;
  }

  reloadListen(keys) {
    this.stopListen();
    this.startListen(keys);
  }

  getQueue() {
    return this.queue;
  }

  clearQueue() {
    this.queue = [];
  }
}

export default InputListener;
