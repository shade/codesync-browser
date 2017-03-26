const WEBSOCKET_DELIMETER = ':|:'

function Model () {
  this._socket = null
  this._socketEvents = {}
  this.peerList = {}
}


Model.prototype.connectSocket = function (token) {
  // Create and add the socket.
  var socket = new WebSocket(`ws://${URL}/ws?t=${token}`)
  this._socket = socket

  // Configure the socket to the model.
  this.__configSocket()
  App.Controller._addSocketListeners()
}


Model.prototype.onSocket = function (event, callback) {
  // Check if the event exists...
  if (this._socketEvents[event]) {
    // If it does, push it.
    this._socketEvents[event].push(callback)
  } else {
    // Otherwise, call it.
    this._socketEvents[event] = [callback]
  }
}


Model.prototype.createPeer = function (userId, newUser) {
  var peer = new Peer(userId, newUser)
  this.peerList[userId] = peer
}


/** Private Methods */

/**
 * Configures the socket method that's built into the WebSocket API
 */
Model.prototype.__configSocket = function () {
  var self = this
  var socket = this._socket

  socket.onmessage = (event) => {
    var dataArr = event.data.split(WEBSOCKET_DELIMETER)

    // If there isn't 2 halves to the data, error it.
    if (dataArr.length != 2) {
      // Find the event listeners
      var clalbacks = self._socketEvents[dataArr[0]]

      // Go through the callbacks and execute them with the data.
      for (var i = 0, ii = callbacks.length; i < ii; i++) {
        callbacks[i](dataArr[1])
      }
    } else {
      console.error('WebSocket sent out invalid data!')
      console.error(event.data)
    }
  }

  socket.onclose = () => {
    console.warn('Your websocket connection closed...')
    // In the future:
    //  - Add a reconnection thing
    //  - Add user feedback.
  }
}