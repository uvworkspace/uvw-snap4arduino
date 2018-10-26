
var EventEmitter = require('events');

class WebSocketClient extends WebSocket {
  constructor(host) {
    super(host);
    EventEmitter(this);

    let me = this;
    me.onmessage = function (event) {
      me.emit('data', Buffer.from(event.data));
    };
  }

  write(data) {
    super.send(data);
  }
}

module.exports = WebSocketClient;
