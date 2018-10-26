
const bindTransport = require('firmata-monorepo/packages/firmata-io/lib/firmata');
const Firmata = bindTransport.Firmata;
const WebSocketClient = require('./websocket');

Arduino.prototype.disconnect = function (silent, force) {
    // Prevent disconnection attempts before board is actually connected
    if ((this.board && this.isBoardReady()) || force) {
        this.disconnecting = true;
        if (this.port === 'network') {
            this.board.transport.close();
        } else {
            if (this.board.transport && !this.board.transport.disconnected) {
                if (!this.connecting || force) {
                    // otherwise something went wrong in the middle of a connection attempt
                    this.board.transport.close();
                }
            }
        }
        this.closeHandler(silent);
    } else {
        if (!silent) {
            ide.inform(this.owner.name, localize('Board is not connected'))
        }
    }
};

Arduino.prototype.attemptConnection = function () {
    var myself = this;

    if (!this.connecting) {
        if (this.board === undefined) {
            // Get list of ports (Arduino compatible)
            var ports = world.Arduino.getSerialPorts(function (ports) {
                var portMenu = new MenuMorph(this, 'select a port');
                if (Object.keys(ports).length >= 1) {
                    Object.keys(ports).forEach(function (each) {
                        portMenu.addItem(each, function () { 
                            myself.connect(each);
                        })
                    });
                }

                portMenu.addItem('Network port', function() {
                    myself.networkDialog();
                });

                portMenu.popUpAtHand(world);
            });
        } else {
            ide.inform(myself.name, localize('There is already a board connected to this sprite'));
        }
    }

    if (this.justConnected) {
        this.justConnected = undefined;
        return;
    }
};

Arduino.prototype.connect = function (port, verify, channel) {
    var myself = this;

    this.disconnect(true);

    this.showMessage(localize('Connecting board at port\n') + port);
    this.connecting = true;

    if (channel === 'network') {
      var host = port;
      if (host.indexOf('tcp://') === 0) {
          host = host.slice(6);
      }
      if (host.indexOf('ws://') === 0) {
          host = host.slice(5);
      }

      hostname = host.split(':')[0];
      netPort = host.split(':')[1] || 23;

      this.hostname = 'ws://' + hostname + ':' + netPort;

      this.owner.parentThatIsA(IDE_Morph).saveSetting(
          'network-serial-hostname',
          this.hostname);

      this.showMessage(localize('Connecting to network port:\n') +
          this.hostname + '\n\n' +
          localize('This may take a few seconds...'));

      this.disconnect(true);
      this.connecting = true;

      let ws = new WebSocketClient(this.hostname);
      ws.binaryType = "arraybuffer";

      ws.onopen = function(event) {
        myself.board = new Firmata(ws, function(err) {
          // Clear timeout to avoid problems if connection is closed before timeout is completed
          clearTimeout(myself.connectionTimeout);
          if (!err) {
            // Start the keepAlive interval
            myself.keepAliveIntervalID = setInterval(function() { myself.keepAlive() }, 5000);

            myself.board.transport.on('close', function () { 
              myself.closeHandler.call(myself);
            });
            myself.board.transport.on('error', function () { 
              myself.errorHandler.call(myself); 
            });

            myself.port = 'network';
            myself.connecting = false;
            myself.justConnected = true;
            myself.board.connected = true;
            myself.board.transport.path = myself.hostname;

            myself.hideMessage();
            myself.board.getArduinoBoardParam = nop;
            myself.board.checkArduinoBoardParam = nop;

            ide.inform(myself.owner.name, localize('An Arduino board has been connected. Happy prototyping!'));
          }
          return;
        });

        // Set timeout to check if device does not speak firmata (in such case new Board callback was never called, but board object exists)
        this.connectionTimeout = setTimeout(function () {
          // compatible
          myself.board.sp = myself.board.transport;

            // If !board.versionReceived, the board has not established a firmata connection
            if (myself.board && !myself.board.versionReceived) {
                var port = myself.board.transport.path;

                myself.hideMessage();
                ide.inform(
                        myself.owner.name,
                        localize('Could not talk to Arduino in port\n')
                        + port + '\n\n' + localize('Check if firmata is loaded.')
                        );

                // silent and forced closing of the connection attempt
                myself.disconnect(true, true);
            }
        }, 10000);
      };

      return;
    }

    // Hyper convoluted due to the async nature of Firmata
    // Brace yourselves, you're about to dive into the Amazing Callback Vortex
    new world.Arduino.firmata.Board(port, function (boardId) { 
        var board,
        retries = 0,
        boardReadyInterval = setInterval(
                function () {
                    postal.sendCommand('getBoard', [ boardId ], function (board) {
                        myself.board = board;
                        if (board && board.versionReceived) {
                            clearInterval(boardReadyInterval);
                            // We need to populate the board with functions that make use of the browser plugin
                            myself.populateBoard(myself.board);

                            myself.keepAliveIntervalID = setInterval(function() { myself.keepAlive() }, 5000);

                            // These should be handled at plugin side
                            // myself.board.sp.on('disconnect', myself.disconnectHandler);
                            // myself.board.sp.on('close', myself.closeHandler);
                            // myself.board.sp.on('error', myself.errorHandler);

                            world.Arduino.lockPort(port);
                            myself.port = myself.board.transport.path;
                            myself.connecting = false;
                            myself.justConnected = true;
                            myself.board.connected = true;

                            myself.hideMessage();
                            ide.inform(myself.owner.name, localize('An Arduino board has been connected. Happy prototyping!'));
                        }
                    });

                    if (retries > 40) {
                        clearInterval(boardReadyInterval);
                        myself.board = null;
                        myself.hideMessage();
                        ide.inform(
                                myself.owner.name,
                                localize('Could not talk to Arduino in port\n')
                                + port + '\n\n' + localize('Check if firmata is loaded.')
                                );
                    }

                    retries ++;
                },
        250);
    });
};
