const BYTE_MASK = 255 // Same as 0b1111 1111
const PACKET_BLOCK_DELIMETER = String.fromCharCode(0)+String.fromCharCode(0)
const BLOCK_WORD_DELIMETER = String.fromCharCode(0)

function Controller() {

}


Controller.prototype.sendCursor = (line, ch) => {
  // Convert the nums to string.
  var posString = String.fromCharCode(
    (line >> 16) & BYTE_MASK,
    (line >> 8) & BYTE_MASK,
    line & BYTE_MASK,
    (ch >> 16) & BYTE_MASK,
    (ch >> 8) & BYTE_MASK,
    ch & BYTE_MASK)

  // Package everything together.
  data = 'C'+posString
  console.log('Sending Cursor',data)
  // Send to all the peers.
  App.Model.broadcast(data)
}


/** Private Methods */
Controller.prototype._addSocketListeners = () => {
  var self = this

  // According to the docs, the events we should be listening for are:
  // `list`
  // `died`
  // `msg`

  App.Model.onSocket('list', data => {
    // Try to extract a json array from this.
    try {
      var userArr = JSON.parse(data)
    } catch (e) {
      console.warn('The Socket Server sent some invalid json with list')
      console.warn(data)
      return
    }

    // Go through each user, and create a peer for him.
    userArr.forEach(user => {
      var peer = App.Model.createPeer(user)
      
      // Show these peers on the view.
      App.View.Loading.addUser(user)
      self._addPeerListeners(peer)
    })

  })

  // If the peer exists, msg him
  // Otherwise, add him as a new user.
  App.Model.onSocket('msg', data => {
    // Try to extract a json array from this.
    try {
      var msg = JSON.parse(data)
    } catch (e) {
      console.warn('The Socket Server sent some invalid json with msg')
      console.warn(data)
      return
    }

    App.Model._handleSDP(msg)
  })
}

Controller.prototype._addPeerListeners = (peer) => {
  var you = peer.user_id

  // Types of data.
  // CURSOR: 'C'
  peer.onData('C', (packet) => {
    // init vars we need.
    var line = 0
    var ch = 0

    // Parse First 00-05, fLine and fCh.
    line = (packet.charCodeAt(0) << 16) | (packet.charCodeAt(1) << 8) | (packet.charCodeAt(2))
    ch = (packet.charCodeAt(3) << 16) | (packet.charCodeAt(4) << 8) | (packet.charCodeAt(5))

    console.log('Got Cursor, here',line, ch)
    // Update the view appropriately.
    App.View.Editor.updateCursor(you, line, ch)
  })
}