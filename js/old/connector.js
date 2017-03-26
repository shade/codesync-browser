////////////////////////////////////////////////////////////////////////
// The connector connects the websockets to the binary to the editor. //
////////////////////////////////////////////////////////////////////////

// This happens after you're logged in.
function start (token) {
  // Start the websocket server.
  var Socket = new WebSocket(`ws://138.197.153.174/ws?t=${token}`)
  // Set the binary listeners.
  var Binary = new Binary()
  // Connect the binary to the socket.
  Binary.connect(Socket)
  // Ask about the repo you want to connect to.
  ConnectionBox.ask = true
  ConnectionBox.socket = Socket
}