
// Create a configuration for ice servers. This is constant.
var CONFIG = {
  'iceServers': [{
    'url': 'stun:stun.l.google.com:19302'
  }]
}


/**
 * Create a peer using a userId and make it create an offer.
 * @param {String} userId  - The User Id for the person
 * @param {Boolean} newUser - True if this is a user that you don't have to offer.
 */
function Peer (userId, newUser) {
  this.userId = userId

  // Private vars.
  this._events = {}
  this._peer = new RTCPeerConnection(CONFIG)

  // Set up the listeners for the peer.
  this.listen()
  // If this is not a new user, signal an offer.
  newUser || this.make('offer')
}



/**
 * Handle any kind of signaling data sent to the peer. 
 * @param  {Any, usually String} the sdp/ice information. 
 */
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
    this._peer.setRemoteDescription(descro, () => {
      
      // Give out an answer, if this is an sdp offer.
      if (self.remoteDescription.type == 'offer') {
        self.make('answer')
      }
    })
  }
  else {
    // Add this as the ice candidate.
    this._peer.addIceCandidate(new RTCIceCandidate(data.data))
  }
}

/** 
* Used to make a local Answer or Offer
* @param type - Enum('offer','answer')
*/
Peer.prototype.make = function (type) {
  var self = this

  if (type == 'offer') {

    // Create and set the local Offer.
    self._peer.createOffer((description) => {
      // Set this as the localDescription. According to WebRTC we can't
      // create candidates until this is set.
      self._peer.setLocalDescription(description, () => {
        // Send the offer to the remote person.
        self.send('sdp', self._peer.localDescription)
      })
    },
    (error) => {
      console.error('Some stupid error happened with WebRTC offer')
      console.error(error)
    })


  } else if (type == 'answer') {

    // Create and set the local Answer
    self._peer.createAnswer((description) => {
      // Set this as the localDescription. According to WebRTC we can't
      // create candidates until this is set.
      self._peer.setLocalDescription(description, () => {
        // Send the offer to the remote person.
        self.send('sdp', self._peer.localDescription)
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

/**
 * Sends some kind of data to some previous set callbacks
 * @param  {String} type - The type of event to send out.
 * @param  {Any} data - The type of data we want to send to the callback
 */
Peer.prototype.send = function (type, data) {
  // Go through the event callbacks for the data.
  var evs = this._events
  for (var i = 0, ii = evs.length; i < ii; i++) {
    // Execute the callback with the data.
    evs[i](data)
  }
}

/**
 * Set up the listeners for the peer.
 */
Peer.prototype.listen = function () {
  self = this

  // Runs when we get an ice candidate. Then sends it.
  this._peer.onicecandidate = (event) => {
    var candidate = event.candidate
    self.send('ice', candidate)
  }

  // Since we're first, we gotta generate an offer.
  this._peer.onnegotiationneeded = () => {
    // Create the offer and send it on callback.
    self.make('offer')
  }
}

/**
 * Create a function to add listeners for datachannel events.
 * @param  {String}   event    - the event we're listening for.
 * @param  {Function} callback - the callback on the event.
 */
Peer.prototype.on = function (events, callback) {
  // Split the event by the | delimeter.
  var eventArr = events.split('|')

  // Go through the events.
  eventArr.forEach( event => {
    // Get the callback list for the event.
    var eventList = this._events[event]
    
    // If the event list exists, just push it. 
    // Otherwise, create it.
    if (eventList) {
      this._events[event] = [callback]
    } else {
      eventList.push(callback)
    }
  })
}
