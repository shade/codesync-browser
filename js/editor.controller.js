
function Controller() {

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
      self._addPeerListeners(peer)
    })
  })

  // If the peer exists, msg him
  // Otherwise, add him as a new user.
  App.Model.onSocket('msg', data => {
    
  })
}