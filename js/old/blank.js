
function Connector () {
  // Ensure that this is a singleton.
  window.Connector = this

  // Create the appropriate lists and socket stuff.
  this.PeerList = {}
  this.socket = null
}


/**
 * Sets up a provided WebSocket for recieving and providing data.
 * @param {WebSocket} socket - The socket by which data is passed to the server.
 * 
 **/
Connector.prototype.setSocket = function (socket) {
  self = this
  self.socket = socket

  self.socket.on('list', data => {
    // Go through the list of people.
    // Create peers for them and add them to the list.
    for(var i = data.length; i--;) {
      self.PeerList[data.from] = self.makePeer(data.from)
    }
  })

  self.socket.on('sdp', data => {

    // If someone is trying to hit you up.
    // Make an answer.
    if (!self.PeerList[data.from]) {
      self.PeerList[data.from] = self.makePeer(data.from, true)
    } else {
      self.PeerList[data.from].handle(data.from, data)
    }
  })
}

Connector.prototype.makePeer = function (userId, newUser, offer) {
  // Create the peer.
  var peer = new Peer(userId, newUser)

  // If this is a newUser, we gotta make an answer for him.
  // Otherwise, create an offer.
  if (newUser) {
    peer.handle()
  } else {

  }

  return peer
}


/**
 * Broadcasts data to all the peers connected to this connector.
 * @param  {String} data - the String of data to be sent.
 */
Connector.prototype.broadcast = function (data) {
  // Iterate through the peers.
  for (var peer in this.PeerList) {
    // Send the provided data to the peer.
    this.PeerList[peer].send(data)
  }
}