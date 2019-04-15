"use strict";

var text;
var parentElement;
var currentSelection;
let currentSelectionStartRelative;
let currentSelectionEndRelative;
let max_span_id = 0;

function openTextFile(event) {
  var input = event.target;
  var reader = new FileReader();
  reader.onload = function() {
    text = reader.result;

//    document.getElementById('output-box').innerHTML = text;
    max_span_id = 0;
    document.getElementById('output-box').innerHTML = "<span id='output-span-" + max_span_id + "' data-pos=0>" + text + "</span>";

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

  if (document.getSelection().focusNode.parentElement.id.includes('output-span')) {
//  if (parentElement.id.includes('output-box') && document.getSelection().toString().length >= 4) {
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

function getNextSpanId()
{
    ++max_span_id;

    return max_span_id;
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

    let span = document.createElement('span');
    span.setAttribute("id", "output-span-" + getNextSpanId());    

    let parent_pos = +parentElement.getAttribute("data-pos");
    span.setAttribute("data-pos", parent_pos + textBeforeSelection.length);
    span.setAttribute("class", "highlight");

    let selection = originalText.substring(currentSelectionStartRelative, currentSelectionEndRelative);
    span.innerHTML = spacesToHtmlSpaces(selection);
//    parentElement.parentNode.insertBefore(span, parentElement.nextSibling);
    parentElement.parentNode.insertBefore(span, parentElement.nextSibling);

    let spanAfterSelection = document.createElement('span');
    spanAfterSelection.setAttribute("id", "output-span-" + getNextSpanId());
    spanAfterSelection.setAttribute("data-pos", parent_pos + textBeforeSelection.length + selection.length);

    spanAfterSelection.innerHTML = spacesToHtmlSpaces(originalText.substring(currentSelectionEndRelative, originalText.length));
//    parentElement.parentNode.insertBefore(spanAfterSelection, parentElement.nextSibling);
    parentElement.parentNode.insertBefore(spanAfterSelection, span.nextSibling);

//    $(this).children(':gt('+half+')').detach().wrapAll('<ul></ul>').parent().insertAfter(this);

/*
    const originalText = parentElement.innerHTML;

    $('#output-box')
        .html(
            originalText.slice(0, currentSelectionStartRelative) + 
            '<span>' + 
            originalText.slice(currentSelectionStartRelative, currentSelectionEndRelative) + 
            '</span>' + 
            originalText.slice(currentSelectionEndRelative));
*/
}

document.addEventListener('selectionchange', textSelection);
document.getElementById("add-info").addEventListener("click", addInfoClick);
