


var editorElement = document.getElementById("editor")

var a = CodeMirror.fromTextArea(editorElement, {
  lineNumbers: true,
  mode: "text/javascript",
  indentUnit: 2,
  tabSize: 2,
  theme: "base16-dark"
});


a.on('change', function (e,obj){
  console.log(obj)
})
a.on('cursorActivity', function () {
  console.log(a.getCursor())
})