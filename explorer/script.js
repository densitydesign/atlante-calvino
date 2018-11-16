var text;

var openFile = function(event) {
  var input = event.target;
  var reader = new FileReader();
  reader.onload = function() {
    text = reader.result;

    document.getElementById('output-box').innerHTML = text;

    if (text) {
      $('#saveBtn').show()
    } else {
      $('#saveBtn').hide()
    }

  };
  reader.readAsText(input.files[0]);
};


function textSelection() {
  // console.log('selection changed');
  console.log(document.getSelection().getRangeAt(0));

  // console.log(document.getSelection().focusNode.parentElement.id)

  if (document.getSelection().focusNode.parentElement.id == 'output-box') {
    let currentSelection = document.getSelection().toString();
    let currentSelectionStart = document.getSelection().getRangeAt(0).startOffset;
    let currentSelectionEnd = document.getSelection().getRangeAt(0).endOffset;
    d3.select('#current-selection').html(currentSelection);
    d3.select('#current-selection-start').html(currentSelectionStart);
    d3.select('#current-selection-end').html(currentSelectionEnd);
  }

}

document.addEventListener('selectionchange', textSelection);
