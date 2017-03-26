// This script is run like a binary executable.
var config = {
  'iceServers': [{
    'url': 'stun:stun.l.google.com:19302'
  }]
}

/**
 * The Peer function, used to create peer obejcts.
 * @param {String} id - This is the id of the person given by the server.
 */
function Peer (id) {
  // This is this.
  var self = this
  
  // Create the instance params.
  this.peer = new RTCPeerConnection(config)  
  this.id = id
  this.channel = null

  // Runs when we get an ice candidate. Then sends it.
  this.peer.onicecandidate = (event) => {
    var candidate = event.candidate
    self.send('ice', candidate)
  }

  // Since we're first, we gotta generate an offer.
  this.peer.onnegotiationneeded = () => {
    // Create the offer and send it on callback.
    self.make('offer')
  }

  // Also, make sure if the other person makes a datachannel use it.
  this.peer.ondatachannel = (event) => {
    self.channel = event.channel
    self.addChannelListeners(self.channel)
  }
}



/** Used to make a local Answer or Offer
    @param type - Enum('offer','answer')
 */
Peer.prototype.make = function (type) {
  var self = this

  if (type == 'offer') {

    // Create and set the local Offer.
    self.peer.createOffer((description) => {
      // Set this as the localDescription. According to WebRTC we can't
      // create candidates until this is set.
      self.peer.setLocalDescription(description, () => {
        // Send the offer to the remote person.
        self.send('sdp', self.peer.localDescription)
      })
    },
    (error) => {
      console.error('Some stupid error happened with WebRTC offer')
      console.error(error)
    })


  } else if (type == 'answer') {

    // Create and set the local Answer
    self.peer.createAnswer((description) => {
      // Set this as the localDescription. According to WebRTC we can't
      // create candidates until this is set.
      self.peer.setLocalDescription(description, () => {
        // Send the offer to the remote person.
        self.send('sdp', self.peer.localDescription)
      })
    },
    (error) => {
      console.error('Some stupid error happened with WebRTC')
      console.error(error)
    })

  } else {
    // If the type is not in the enumeration.
    console.warn('Peer.make called with non-registered type: ', type)
  }
}




/** Sending stuff to the server. For signaling only! */
Peer.prototype.send = function (type, data) {
  switch(type) {
    case 'ice':
    case 'sdp':
    log(JSON.stringify({
      event: 'conn',
      to: this.id,
      data: {
        type: type,
        data: data
      }
    }))
      break
  }
}




/** Handles stuff recieved by the server. */
Peer.prototype.handle = function (data) {
  // This is this!
  var self = this

  // Try parsing the json.
  try {
    var {from, data} = JSON.parse(data)
  } catch (e) {
    console.warn('The Socket spat out some invalid JSON')
    console.warn(data)
  }

  // Now actually deal with the stuff.
  if (data.type == 'sdp') {

    // Create the remote description using the sdp.
    var descro = new RTCSessionDescription(data.data)
    // Add this as the Remote Description.
    this.peer.setRemoteDescription(descro, () => {
      
      // Give out an answer, if this is an sdp offer.
      if (self.remoteDescription.type == 'offer') {
        self.make('answer')
      }
    })
  }
  else {
    // Add this as the ice candidate.
    this.peer.addIceCandidate(new RTCIceCandidate(data.data))
  }
}



/** Create a data channel. Should be called once.*/
Peer.prototype.channelify = function () {
  // Create the actual datachannel.
  this.channel = this.peer.createDataChannel('data', {
    ordered: true, // Make sure everything happens in order.
  })

}




Peer.prototype.addChannelListeners = function (channel) {
  var self = this
  
  channel.onmessage = function (event) {

  }
  channel.onopen = function (event) {

  }
  channel.onclose = function (event) {
    
  }
}

