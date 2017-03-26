//////////////////////////
// Create an AJAX Thing //
//////////////////////////

var AJAX = {}


AJAX.post = (opts) => {
  // Create the post request.
  var request = new XMLHttpRequest()
  request.open('POST', opts.url, true)
  request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8')

  // Return a promise for it
  return new Promise((resolve, reject) => {
    request.onload = () => {
      resolve(request.responseText)
    }
    request.onerror = () => {
      reject(request.responseText)
    }

    request.send(opts.data)
  })
}