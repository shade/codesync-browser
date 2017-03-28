
// Heartbeat interval
const HEARTBEAT_INTERVAL = 1000

// Create a configuration for ice servers. This is constant.
const CONFIG = {
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
  var self = this
  this.userId = userId

  // Private vars.
  this._events = {}
  this._channelEvents = {}

  this._peer = new RTCPeerConnection(CONFIG)
  this._channel = null
  this._heartbeat = null
  this.created = Date.now()

  // Set up the listeners for the peer.
  this.listen()
  // If this is not a new user:
  //  - signal an offer.
  //  - make a datachannel. (done in handle.)
  if (!newUser) {
    this.make('offer')
  }
}

/**
 * Handle any kind of signaling data sent to the peer. 
 * @param  {Any, usually String} the sdp/ice information. 
 */
Peer.prototype.handle = function (data) {
  // This is this!
  var self = this
  console.log('DATA PASSED TO PEER',data)

  // Try parsing the json.
  data = data.data
  if (!data) return

  // Now actually deal with the stuff.
  if (data.sdp) {

    // Create the remote description using the sdp.
    var descro = new RTCSessionDescription(data)
    // Add this as the Remote Description.
    this._peer.setRemoteDescription(descro, () => {
      
      // Give out an answer, if this is an sdp offer.
      if (self._peer.remoteDescription.type == 'offer') {
        self.make('answer')
        
        // Since we're recieving an offer, this means that this is not a new user. 
        // We also have to make a datachannel here, as we can only do that after we set our remote description.
        self._channel = self._peer.createDataChannel('dc')
        self._listenChannel(self._channel)
      }
    })
  }
  else {
    // Add this as the ice candidate.
    this._peer.addIceCandidate(new RTCIceCandidate(data))
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
  var evs = this._events[type] || []
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

  // If someone signals a datachannel, catch it.
  this._peer.ondatachannel = (event) => {
    self._channel = event.channel
    self._listenChannel(self._channel)
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
      eventList.push(callback)
    } else {
      this._events[event] = [callback]
    }
  })
}


Peer.prototype._listenChannel = function (channel) {
  var self = this

  // When this opens, hide the loading screen.
  channel.onopen = () => {
    console.log(`Connection took ${Date.now() - self.created}ms`)
    //App.View.Loading.hide()// Send heartbeats.
    if (!self._heartbeat) {
      self._heartbeat = setInterval(() => {
        channel.send('H')
      },HEARTBEAT_INTERVAL)
    }
  }

  channel.onmessage = (event) => {
    // Get the current time.
    var now = performance.now()

    // Grab the data.
    var data = event.data
    // If it's a heart beat, record the current time, high accuracy.
    if (data[0] == 'H') {
      console.log(`Latency = ${(now - self.lastBeat)/(2 * HEARTBEAT_INTERVAL)}ms`)
      self.lastBeat = now
    }

    // If there's a list of callbacks for an event, grab it.
    var evs
    if (evs = self._channelEvents[data[0]]) {
      var dat = data.substr(1)
      // Iterate through all the callbacks and call em.
      for(var i = 0, ii = evs.length; i < ii; i++) {
        // Call em with the extra data
        evs[i](dat)
      }
    }
  }

  channel.onerror = () => {
    console.log('eeror')
  }
}

// Adds the listeners to the 
Peer.prototype.onData = function (event, callback) {

}
