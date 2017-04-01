const BYTE_MASK = 255 // Same as 0b1111 1111
const BLOCK_WORD_DELIMETER = String.fromCharCode(0x1d).repeat(3)

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

Controller.prototype.sendMsg  = (from, to, text) => {
  // Convert the nums to string.
  // Init the necessary vars.
  var line = from.line
  var ch = from.ch
  // Create a string for from chars.
  var fromString = String.fromCharCode(
    (line >> 16) & BYTE_MASK,
    (line >> 8) & BYTE_MASK,
    line & BYTE_MASK,
    (ch >> 16) & BYTE_MASK,
    (ch >> 8) & BYTE_MASK,
    ch & BYTE_MASK)
  // Reassign vars
  
  line = to.line
  ch = to.ch

  // Create a string for to chars.
  var toString = String.fromCharCode(
    (line >> 16) & BYTE_MASK,
    (line >> 8) & BYTE_MASK,
    line & BYTE_MASK,
    (ch >> 16) & BYTE_MASK,
    (ch >> 8) & BYTE_MASK,
    ch & BYTE_MASK)

  // Format the new text
  var lines = text.join(BLOCK_WORD_DELIMETER)

  // Package everything together.
  // Replace the join, with just concat later for efficiency.
  data = 'M' + fromString + toString + lines

  // Debug, remove later..
  console.log('Sending Msg Data',data)
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
    for (var i = 0, ii = userArr.length; i < ii; i++){
      var user = userArr[i]
      var peer = App.Model.createPeer(user)
      
      // Show these peers on the view.
      App.View.Loading.addUser(user)
      console.log(self)
      self._addPeerListeners(peer)
    }

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
  peer.onData('C', packet => {
    // init vars we need.
    var line = 0
    var ch = 0

    // Parse 00-05, line and ch
    line = (packet.charCodeAt(0) << 16) | (packet.charCodeAt(1) << 8) | (packet.charCodeAt(2))
    ch = (packet.charCodeAt(3) << 16) | (packet.charCodeAt(4) << 8) | (packet.charCodeAt(5))

    console.log('Got Cursor, here',line, ch)
    // Update the view appropriately.
    App.View.Editor.updateCursor(you, line, ch)
  })

  // MESSAGE: 'M'
  peer.onData('M', packet => {

    // The parts are as follows.
    // PART 1: to from info
    // PART 2: Added lines

    // Cursor is the first 12 bytes.
    var cursor = packet.substr(0, 12)

    // init vars.
    var fLine = 0
    var fCh = 0
    var tLine = 0
    var tCh = 0

    // Parse First 00-05, fLine and fCh.
    fLine = (cursor.charCodeAt(0) << 16) | (cursor.charCodeAt(1) << 8) | (cursor.charCodeAt(2))
    fCh = (cursor.charCodeAt(3) << 16) | (cursor.charCodeAt(4) << 8) | (cursor.charCodeAt(5))

    // Parse next 06-11, tLine and tCh.
    tLine = (cursor.charCodeAt(6) << 16) | (cursor.charCodeAt(7) << 8) | (cursor.charCodeAt(8))
    tCh = (cursor.charCodeAt(9) << 16) | (cursor.charCodeAt(10) << 8) | (cursor.charCodeAt(11))

    // Lines is the rest of the thing
    var lines = packet.substr(12).split(BLOCK_WORD_DELIMETER)

    // DEbug, remove later.
    console.log('Got Message,',fLine, fCh, tLine, tCh, lines)
    // Update the view accordingly.
    App.View.Editor.addText(fLine, fCh, tLine, tCh, lines)
  })
}