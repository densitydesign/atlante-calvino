var text;
var parentElement;
var curentSelection;
let currentSelectionStartRelative;
let currentSelectionEndRelative;

function openTextFile(event) {
  var input = event.target;
  var reader = new FileReader();
  reader.onload = function() {
    text = reader.result;

//    document.getElementById('output-box').innerHTML = text;
    document.getElementById('output-box').innerHTML = "<div id='output-block-1' data-pos=0>" + text + "</div>";

    if (text) {
      $('#saveBtn').show()
    } else {
      $('#saveBtn').hide()
    }

  };
  reader.readAsText(input.files[0]);
};

function openStructureFile(event) {
    var input = event.target;
    var reader = new FileReader();

    reader.onload = 
        function() 
        {
            text = reader.result;
        
            let data = text.split(/\r?\n/);
            let lines = data.slice(1, data.length);

            lines.forEach(line => {
                let fields = line.split("\t");

                let name = fields[0];
                let type = fields[1];
                let values = fields[2];

                createControl(name, type, values);
            });
        };

    reader.readAsText(input.files[0]);
}

function createControl(name, type, values)
{
    switch(type)
    {
        case "select":

            let selector = d3
                .select("#info-box")
                .append("select")
                .attr("id", name);

            let value_items = values.split(";");

            value_items.forEach(item => {
                let option = selector
                    .append("option")
                    .attr("value", item)
                    .text(item);
            });

            break;
    }
}

function textSelection() {
  // console.log('selection changed');
  console.log(document.getSelection().getRangeAt(0));

  // console.log(document.getSelection().focusNode.parentElement.id)

  parentElement = document.getSelection().focusNode.parentElement;

//  if (document.getSelection().focusNode.parentElement.id.contains('output-block')) {
  if (parentElement.id.includes('output-block')) {
    currentSelection = document.getSelection().toString();
    d3.select('#current-selection').html(currentSelection);

    currentSelectionStartRelative = document.getSelection().getRangeAt(0).startOffset;
    let currentSelectionStartAbsolute = currentSelectionStartRelative + (+parentElement.dataset.pos);
    d3.select('#current-selection-start').html(currentSelectionStartAbsolute);

    currentSelectionEndRelative = document.getSelection().getRangeAt(0).endOffset;
    let currentSelectionEndAbsolute = currentSelectionEndRelative + (+parentElement.dataset.pos);
    d3.select('#current-selection-end').html(currentSelectionEndAbsolute);
  }
}

function spacesToHtmlSpaces(s)
{
    return s.replace(" ", "&nbsp;")
}

function htmlSpacesToSpaces(s)
{
    return s.replace("&nbsp;", " ");
}

function addInfoClick() {
//  let innerHtml = d3.select("#output-box").nodes().map((d) => { return d.innerHTML; })
    let innerHtml = parentElement.innerHTML;

/*
    parentElement.innerHTML = 
        parentElement.innerHTML.substring(0, currentSelectionStartRelative) + 
        "</div><span>" + 
        currentSelection +
        "</span><div>" +
        parentElement.innerHTML.substring(currentSelectionEndRelative, parentElement.innerHTML.length);
*/

    const originalText = htmlSpacesToSpaces(parentElement.innerText);

    let textBeforeSelection = originalText.substring(0, currentSelectionStartRelative);
    let s2 = spacesToHtmlSpaces(textBeforeSelection);
    parentElement.innerHTML = s2;

    let a = 5;

    let span = document.createElement('span');
    span.innerText = spacesToHtmlSpaces(originalText.substring(currentSelectionStartRelative, currentSelectionEndRelative));
//    parentElement.parentNode.insertBefore(span, parentElement.nextSibling);
    parentElement.parentNode.insertBefore(span, parentElement.nextSibling);

    let divAfterSelection = document.createElement('div');
    divAfterSelection.innerText = spacesToHtmlSpaces(originalText.substring(currentSelectionEndRelative, originalText.length));
    parentElement.insertBefore(divAfterSelection, parentElement.nextSibling);

//    $(this).children(':gt('+half+')').detach().wrapAll('<ul></ul>').parent().insertAfter(this);
}

document.addEventListener('selectionchange', textSelection);
document.getElementById("add-info").addEventListener("click", addInfoClick);
