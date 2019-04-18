"use strict";

var text;
var parentElement;
var currentSelection;
let currentSelectionStartRelative;
let currentSelectionEndRelative;
let max_span_id = 0;
let annotation_fields_map = {};
let annotations;

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
        $('#saveBtn').show()
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
        let fileText = reader.result;
    
        let fileLines = fileText.split(/\r?\n/);
        let dataLines = fileLines.slice(1, fileLines.length);

        let index = 0;

        dataLines.forEach(line => {
            let fields = line.split("\t");

            let name = fields[0];
            let type = fields[1];
            let values = fields[2];

            let readControl;
            let parseTextValue;
            
            switch(type)
            {
              case "text" :
              {
                if(values == "") readControl = readTextInput;
                else readControl = readText;

                parseTextValue = parseStringField;

                break;
              }
              case "number" :
                readControl = readNumber;

                parseTextValue = parseNumberField;

                break;
              case "select" :
                readControl = readSelect;

                parseTextValue = parseStringField;

                break;
              case "checkbox" :
                readControl = readCheckbox;

                parseTextValue = parseBooleanField;

                break;
            }

            annotation_fields_map[name] = { 
              type: type, 
              values: values, 
              readControl: readControl, 
              parseTextValue: parseTextValue, 
              index: index++ 
            };

            createControl(name, type, values);
        });
    };

  let input = event.target;
  reader.readAsText(input.files[0]);
}

function openExportedFile(event)
{
  let reader = new FileReader();

  reader.onload =
    function()
    {
      let fileText = reader.result;

      let fileLines = fileText.split(/\r?\n/);

      let dataLines = fileLines
        .slice(1, fileLines.length)
        .filter((line) => { return line.trim() != ""; });

      annotations = dataLines.map(
        function(line)
        {
          let valueMap = readValueMapFromTextLine(line);

          let a = new Annotation(valueMap);

          return a;
        });
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
    new self.Blob([s], {type: "text/plain;charset=utf-8"}),
    "data.txt");
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
/*
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
*/

function highlightAnnotationText(containingElement)
{
  let innerHtml = containingElement.innerHTML;

  const originalText = htmlSpacesToSpaces(containingElement.innerHTML);

  let textBeforeSelection = originalText.substring(0, currentSelectionStartRelative);
  let s2 = spacesToHtmlSpaces(textBeforeSelection).replace(/\n\r?/g, "<br />");
  containingElement.innerHTML = s2;

  let span = document.createElement('span');
  span.setAttribute("id", "output-span-" + getNextSpanId());    

  let parent_pos = +containingElement.getAttribute("data-pos");
  span.setAttribute("data-pos", parent_pos + textBeforeSelection.length);
  span.setAttribute("class", "highlight");

  let selection = originalText.substring(currentSelectionStartRelative, currentSelectionEndRelative);
  span.innerHTML = spacesToHtmlSpaces(selection);
  containingElement.parentNode.insertBefore(span, containingElement.nextSibling);

  let spanAfterSelection = document.createElement('span');
  spanAfterSelection.setAttribute("id", "output-span-" + getNextSpanId());
  spanAfterSelection.setAttribute("data-pos", parent_pos + textBeforeSelection.length + selection.length);

  spanAfterSelection.innerHTML = spacesToHtmlSpaces(originalText.substring(currentSelectionEndRelative, originalText.length));
  containingElement.parentNode.insertBefore(spanAfterSelection, span.nextSibling);
}

function Annotation(valueMap)
{
  let annotation = {};

  for(var key in valueMap)
  {
    annotation[key] = valueMap[key];
  }

  return annotation;
}

function readValueMapFromPageFields()
{
  let valueMap = {};

  for(var key in annotation_fields_map)
  {
    let value = annotation_fields_map[key].readControl(key);
    valueMap[key] = value;
  }

  return valueMap;
}

function readValueMapFromTextLine(line)
{
  let fieldKeys = [];

  for(var key in annotation_fields_map)
  {
    fieldKeys.push(key);
  }

  let valueMap = {};
  let fieldValues = line.split(/\t/);

  for(let i = 0; i < fieldKeys.length; ++i)
  {
    let key = fieldKeys[i];
    valueMap[key] = annotation_fields_map[key].parseTextValue(fieldValues[i]);
  }

  return valueMap;
}

function addAnnotationClick() 
{
  highlightAnnotationText(parentElement);

  let annotationValueMap = readValueMapFromPageFields();
  let annotation = new Annotation(annotationValueMap);

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

function parseStringField(string)
{
  return string;
}

function parseNumberField(string)
{
  return parseInt(string, 10);
}

function parseBooleanField(string)
{
  return (string === 'true');
}

document.addEventListener('selectionchange', textSelection);
document.getElementById('saveBtn').addEventListener("click", saveData);
document.getElementById("add-info").addEventListener("click", addAnnotationClick);




