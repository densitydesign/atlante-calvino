"use strict";

var text;
var parentElement;
var currentSelection;
let currentSelectionStartRelative;
let currentSelectionEndRelative;
let max_span_id = 0;
let annotation_fields_map = {};
let annotations;

$('.loaded-a-structure').hide();

function openTextFile(event)
{
  let reader = new FileReader();

  reader.onload =
    function()
    {
      text = reader.result;

      max_span_id = 0;
      document.getElementById('output-box').innerHTML = "<span id='output-span-" + max_span_id + "' data-pos=0>" + text + "</span>";

      if (text) {
        $('#saveBtn').show();
        $('#load-a-text').hide();
        $('.white-box.annotations').toggleClass('faded');
      } else {
        $('#saveBtn').hide()
      }
    };

  annotations = [];

  let input = event.target;

  reader.readAsText(input.files[0]);
};

function openStructureFile(event)
{
  let reader = new FileReader();

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

            let readControl;

            switch(type)
            {
              case "data_structure_name" :
              {
                $('#data_structure_name').text(values);
                $('.loaded-a-structure').show();
                return;
              }
              case "text" :
              {
                if(values == "") readControl = readTextInput;
                else readControl = readText;
                break;
              }
              case "number" :
                readControl = readNumber;
                break;
              case "select" :
                readControl = readSelect;
                break;
              case "checkbox" :
                readControl = readCheckbox;
                break;
            }

            annotation_fields_map[name] = { type: type, values: values, readControl: readControl };

            createControl(name, type, values);
        });

        $('#load-a-structure').hide();
    };

  let input = event.target;
  reader.readAsText(input.files[0]);
}

function createControl(name, type, values)
{
  switch(type)
  {
    case "text":

      if (values == "currentSelection") break;

      d3
        .select("#info-box")
        .append("label")
        .attr("id", name + "-label")
        .attr("for", name)
        .text(name);

      d3
        .select("#info-box")
        .append("input")
        .attr("id", name)
        .attr("type", "text");

      break;

    case "select":

      d3
        .select("#info-box")
        .append("label")
        .attr("id", name + "-label")
        .attr("for", name)
        .text(name);

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

    case "checkbox":

      d3
        .select("#info-box")
        .append("label")
        .attr("id", name + "-label")
        .attr("for", name)
        .text(name);

      d3
        .select("#info-box")
        .append("input")
        .attr("id", name)
        .attr("type", "checkbox");

      break;
  }
}

function textSelection()
{
//  console.log(document.getSelection().getRangeAt(0));

  parentElement = document.getSelection().focusNode.parentElement;

  if (document.getSelection().focusNode.parentElement.id.includes('output-span'))
  {
    currentSelection = document.getSelection().toString();
    if (currentSelection == "") return;

    d3.select('#occorrenza').html(currentSelection);

    currentSelectionStartRelative = document.getSelection().getRangeAt(0).startOffset;
    let currentSelectionStartAbsolute = currentSelectionStartRelative + (+parentElement.dataset.pos);
    d3.select('#starts_at').html(currentSelectionStartAbsolute);

    currentSelectionEndRelative = document.getSelection().getRangeAt(0).endOffset;
    let currentSelectionEndAbsolute = currentSelectionEndRelative + (+parentElement.dataset.pos);
    d3.select('#ends_at').html(currentSelectionEndAbsolute);
  }
}

function saveData()
{
  let s = "";

  for(var key in annotation_fields_map)
  {
    s += key + "\t";
  }

  s += "\n";

  for(let i = 0; i < annotations.length; ++i)
  {
    let annotation = annotations[i];

    for(var key in annotation_fields_map)
    {
      s += annotation[key] + "\t";
    }

    s += "\n";
  }

  saveAs(
    new self.Blob([s], {type: "text/plain;charset=utf-8"}), "data.tsv");
}

function spacesToHtmlSpaces(s)
{
    return s.replace(" ", "&nbsp;");
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

function highlightAnnotationText()
{
  let innerHtml = parentElement.innerHTML;

  const originalText = htmlSpacesToSpaces(parentElement.innerHTML);

  let textBeforeSelection = originalText.substring(0, currentSelectionStartRelative);
  let s2 = spacesToHtmlSpaces(textBeforeSelection).replace(/\n\r?/g, "<br />");
  parentElement.innerHTML = s2;

  let span = document.createElement('span');
  span.setAttribute("id", "output-span-" + getNextSpanId());

  let parent_pos = +parentElement.getAttribute("data-pos");
  span.setAttribute("data-pos", parent_pos + textBeforeSelection.length);
  span.setAttribute("class", "highlight");

  let selection = originalText.substring(currentSelectionStartRelative, currentSelectionEndRelative);
  span.innerHTML = spacesToHtmlSpaces(selection);
  parentElement.parentNode.insertBefore(span, parentElement.nextSibling);

  let spanAfterSelection = document.createElement('span');
  spanAfterSelection.setAttribute("id", "output-span-" + getNextSpanId());
  spanAfterSelection.setAttribute("data-pos", parent_pos + textBeforeSelection.length + selection.length);

  spanAfterSelection.innerHTML = spacesToHtmlSpaces(originalText.substring(currentSelectionEndRelative, originalText.length));
  parentElement.parentNode.insertBefore(spanAfterSelection, span.nextSibling);
}

function createAnnotation()
{
  let annotation = {};

  for(var key in annotation_fields_map)
  {
    let v = annotation_fields_map[key].readControl(key);
    annotation[key] = v;

    let a = 5;
  }

  return annotation;
}

function addAnnotationClick()
{
  highlightAnnotationText();

  let annotation = createAnnotation();

  annotations.push(annotation);
}

function readText(name)
{
  return d3.select("#" + name).text();
}

function readTextInput(name)
{
//  let control = d3.select("#" + name);
//  let s = control.property("value");
  return d3.select("#" + name).property("value");
//  return s;
}

function readNumber(name)
{
  return +d3.select("#" + name).text();
}

function readSelect(name)
{
  return d3.select("#" + name).property("value");
}

function readCheckbox(name)
{
  return d3.select("#" + name).property("checked");
}

document.addEventListener('selectionchange', textSelection);
document.getElementById('saveBtn').addEventListener("click", saveData);
document.getElementById("add-info").addEventListener("click", addAnnotationClick);
