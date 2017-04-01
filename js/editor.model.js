const WEBSOCKET_DELIMETER = ':|:'

function Model () {
  this._socket = null
  this._socketEvents = {}
  this.peerList = {}
}

Model.prototype.sendSocket = function (event, data) {
  // If this is a send, show it on the view.
  if(event == 'send') {
    // Stack clearing again.
    setTimeout(() => {
      App.View.Loading.showTo(data.to)
    }, 0)
  }

  this._socket.send(event + WEBSOCKET_DELIMETER + JSON.stringify(data))
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

  // Add the listeners to the peer.
  this.__addPeerListeners(peer)
  // Add channel listeners to the peer.
  App.Controller._addPeerListeners(peer)
  return peer
}

Model.prototype.broadcast = function (data) {
  // Iterate through all the peers and send this to their datachannel. If Open.
  for (var name in this.peerList) {
    var peer = this.peerList[name]
    if (peer._channel.readyState == 'open') {
      console.log(name)
      peer._channel.send(data)
    }
  }
}

/** Private Methods */

Model.prototype._handleSDP = function (data) {
  var peer

  // If this person exists, assign him to peer
  if ((peer = this.peerList[data.from])) {
    // Since he exists, give him the sdp data.
    peer.handle(data)
  } else {
    // This person doesn't exist yet, so let's make him.
    var peer = this.createPeer(data.from)
    // Now, give him the data.
    peer.handle(data)
    // Let's add this user to the view.
    App.View.Loading.addUser(data.from)
  }

  // Wait for the stack to clear then show that we got some data from him.
  setTimeout(() => {
    App.View.Loading.showFrom(data.from)
  },0)
}


/**
 * Configures the socket method that's built into the WebSocket API
 */
Model.prototype.__configSocket = function () {
  var self = this
  var socket = this._socket

  socket.onmessage = (event) => {
    var dataArr = event.data.split(WEBSOCKET_DELIMETER)
    console.log(dataArr)

    // If there isn't 2 halves to the data, error it.
    if (dataArr.length == 2) {
      // Find the event listeners
      var callbacks = self._socketEvents[dataArr[0]] || []

      // Go through the callbacks and execute them with the data.
      for (var i = 0, ii = callbacks.length ; i < ii; i++) {
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


Model.prototype.__addPeerListeners = function (peer) {
  var self = this

  // Get the connection data.
  peer.on('ice|sdp',(data) => {
    // Send the connection data.
    self.sendSocket('send',{
      to: peer.userId,
      data: data
    })
  })
}