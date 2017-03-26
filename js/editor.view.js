/**
 * Create the View for the Vue thing.
 */

var View = new Vue({
  el: '#area__login',
  data: {
    username: "",
    password: "",
    errorMsg: "",
    loading: false,
    connecting: false,
    token: localStorage['TOKEN'],
    users: {
      me: document.getElementById('me__loading')
      others: []
    }
  },
  methods: {
    submit: LoginBox__submit,

    showTo: Loading__showTo,
    showFrom: Loading__showFrom,
    addUser: Loading__addUser
  }
})


// All the methods for the Loading Screen.
// Namespaced swith `Loading__`


// Function to show data was sent to a user.
function Loading__showTo (user) {
  var others = this.users.others
  var found = null

  // Find this user's object
  for(var i = 0, ii = others.length; i < ii; i++) {
    if (others[i].name == user) {
      found = others[i]
      break
    }
  }

  // Make it look like he's getting something.
  found.recieved = true
  // Get rid of it half a second later.
  setTimeout(() => {
    found.recieved = false
  },500)
}

// Function to show data was sent from a user.
function Loading__showFrom (user) {

}

// Function to add a user to everything
function Loading__addUser (user) {
  this.users.others.push({
    name: user,
    sent: false,
    recieved: false
  })
}




// The methods for the login box. 
// All are namespaced with `LoginBox__`

// The function to grab a token.
function LoginBox__submit() {
  // If we need it in a callback.
  var self = this

  // We don't want to submit twice in a row.
  if (this.loading) return
  // Show the user that everything is loading...
  this.loading = true
  // Kill any current ErrorMsgs..
  this.errorMsg = ""



  AJAX.post({
    url: `http://${URL}/api/v1/user/auth`,
    data: `username=${this.username}&password=${this.password}`
  }).then(
  (data) => {
    self.loading = false
    // Try to parse the JSON.
    try {
      var json = JSON.parse(data)
    } catch (e) {
      self.errorMsg = "Couldn't connect to the server... :("
      return
    }

    // If there's an error, set it up.
    if (json.error) {
      self.errorMsg = json.error
    }

    // If there's a token, set it.
    // Also, start everything.
    if (json.token) {
      self.token = json.token
      start(json.token)
    }
  },
  (data) => {
    self.loading = false
    self.errorMsg = "Couldn't connect to the server... :("
  })
}


