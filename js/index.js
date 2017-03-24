const URL = '138.197.153.174'



var editorElement = document.getElementById("editor")

var a = CodeMirror.fromTextArea(editorElement, {
  lineNumbers: true,
  mode: "htmlmixed",
  theme: "base16-dark"
});


a.on('change', function (e,obj){
console.log(obj)
})
a.on('cursorActivity', function () {
  console.log(a.getCursor())
})