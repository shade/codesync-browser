
// Create the App using MVC.
// Model      - Holds the WebSocket and WebRTC stuff. Should have .on triggers and what not.
// Controller - Holds the Logic for the editor and some of the WebSocket Stuff.
// View       - Holds the Logic to change the editor and Login and what not.
//

var App = {
  Model: new Model(),
  Controller: new Controller(),
  View: View
}
