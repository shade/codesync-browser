var {Socket} = require('./web')


function LoginController (opts) {
  // Set up the login view.
  this.loginView = opts.view
  // We'll connect the socket, post-login.
  this.socket = null

  // Display the login view.
  this.login()
}