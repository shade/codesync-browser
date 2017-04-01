/**
 * Create the View for the Vue thing.
 */

var View = {}

View.Login = new Vue({
  el: '#area__login',
  data: {
    username: "",
    password: "",
    errorMsg: "",
    loading: false,
    connecting: false,
    token: ''
  },
  methods: {
    // Methods for login.
    submit: LoginBox__submit,
  }
})



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
    // Hide this screen.
    // Also, start everything.
    if (json.token) {
      View.Loading.enabled = true
      self.token = json.token
      App.Model.connectSocket(json.token)
    }
  },
  (data) => {
    self.loading = false
    self.errorMsg = "Couldn't connect to the server... :("
  })
}












View.Loading = new Vue({
  el: '#area__loading',
  data: {
    enabled: false,
    space: "",
    connecting: false,
    loading: false,
    me: document.getElementById('me__loading'),
    others: []
  },
  methods: {
    // Methods for loading.
    showTo: Loading__showTo,
    showFrom: Loading__showFrom,
    addUser: Loading__addUser,

    // Methods for Space stuff.
    submit: Loading__submitSpace
  }
})


// All the methods for the Loading Screen.
// Namespaced swith `Loading__`


// Function to show data was sent to a user.
function Loading__showTo (user) {
  var others = this.others
  var found = null

  // Find this user's object
  for(var i = 0, ii = others.length; i < ii; i++) {
    if (others[i].name == user) {
      found = others[i]
      break
    }
  }

  // Make it look like he's getting something.
  found.sent = true
  // Get rid of it half a second later.
  setTimeout(() => {
    found.sent = false
  },500)
}

// Function to show data was sent from a user.
function Loading__showFrom (user) {
  var others = this.others
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

// Function to add a user to everything
function Loading__addUser (user) {
  this.others.push({
    name: user,
    sent: false,
    recieved: false
  })
}


// Function to submit the space.
function Loading__submitSpace () {
  App.Model.sendSocket('list',{
    space: this.space
  })

  this.connecting = true
}










// HEART BEAT PACKET STRUCTURE 
// 



// CURSOR PACKET STRUCTURE
// 1 Byte 'C'
// 3 Bytes - line
// 3 Bytes - ch

// MESSAGE PACKET STRUCTURE

// 1 Byte 'M'
// 3 Bytes - from.line
// 3 Bytes - from.ch
// 3 Bytes - to.line
// 3 Bytes - to.ch
// \0
// \0
// TEXT:
// String
// \0
// String
// \0
// String
// \0
// String



function Editor () {
  // Create an editor.
  this._editorElement = document.getElementById("editor")
  
  this._editor = CodeMirror.fromTextArea(this._editorElement, {
    lineNumbers: true,
    mode: "htmlmixed",
    theme: "base16-dark"
  })

  // Some private vars
  this._cursors = {}

  // Add Listeners to our editor.
  this._addEditorListeners()
}


Editor.prototype._addEditorListeners = function () {
  var self = this
  var justChanged = false

  this._editor.on('change', function (e,obj){
    justChanged = true
    // Ignore if replaceRange fires this.
    console.log(obj, obj.origin)
    if(!obj.origin) {
      return
    }
    // Send necessary data to the controller.
    App.Controller.sendMsg(obj.from, obj.to, obj.text)
  })


  this._editor.on('cursorActivity', function () {
    // Incomment here when you implement above.    
    if (justChanged) return (justChanged = false)

    // Grab the position.
    var pos = self._editor.getCursor()
    App.Controller.sendCursor(pos.line, pos.ch)
  }) 
}

Editor.prototype.updateCursor = function (user, line, ch) {
  var old = this._cursors[user]

  // clear the old cursor
  old && old.clear()
  // update the new one.
  this._cursors[user] =   this._editor.markText({line: line, ch: ch},{line: line, ch: ch+1},{className: 'mark'})
}

Editor.prototype.addText = function (fLine, fCh, tLine, tCh, lines) {
  this._editor.replaceRange(lines.join('\n'), {line: fLine, ch: fCh},{line: tLine, ch: tCh})
}

View.Editor = new Editor()