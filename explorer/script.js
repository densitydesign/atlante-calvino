"use strict";

var source_title; // the title corresponding to the injected text
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

      source_title = input.files[0].name;

      max_span_id = 0;
      document.getElementById('output-box').innerHTML = "<span id='output-span-" + max_span_id + "' data-pos=0>" + text + "</span>";

      if (text) {
        $('#saveBtn').show();
        $('#load-a-text').hide();
        $('.white-box.annotations').toggleClass('faded');
      } else {
        $('#saveBtn').hide();
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
            let clearControl;

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
                if(values == "")
                {
                   readControl = readTextInput;
                   clearControl = clearTextInput;
                }
                else
                {
                  readControl = readText;
                  clearControl = clearText;
                }

                parseTextValue = parseStringField;

                break;
              }
              case "number" :
                readControl = readNumber;

                parseTextValue = parseNumberField;
                clearControl = clearNumber;

                break;
              case "select" :
                readControl = readSelect;

                parseTextValue = parseStringField;

                clearControl = clearSelect;

                break;
              case "checkbox" :
                readControl = readCheckbox;

                parseTextValue = parseBooleanField;

                clearControl = clearCheckbox;

                break;
            }

            annotation_fields_map[name] = {
              type: type,
              values: values,
              readControl: readControl,
              parseTextValue: parseTextValue,
              index: index++,
              clearControl: clearControl
            };

            createControl(name, type, values);
        });

        $('#load-a-structure').hide();
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

      let fileLines = fileText.split(/\r?\n|\r/);

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

      annotations.forEach(annotation => {

        let containingElement = getContainingElementByInternalPos(annotation.starts_at);

        highlightAnnotationText(containingElement, annotation);
      });

      $('.resumed-analysis').hide();
      $('#annotations-count').text(annotations.length);

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

  let focusNode = document.getSelection().focusNode;

  if(focusNode == null) return;

  if (document.getSelection().focusNode.parentElement.id.includes('output-span'))
  {
    parentElement = focusNode.parentElement;

//    currentSelection = document.getSelection().toString();
    currentSelection = document.getSelection().getRangeAt(0).toString();
  console.log(currentSelection);
    if (currentSelection == "") return;

    d3.select('#occorrenza').html(spacesToHtmlSpaces(currentSelection));

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

  let fileName = `${source_title.replace(/.txt/g, '')} [${new Date().toJSON().slice(0,16).replace(/T/g,' ')}].tsv`;

  saveAs(
    new self.Blob([s], {type: "text/plain;charset=utf-8"}),
    fileName);
}

function spacesToHtmlSpaces(s)
{
  let x = s.replace(" ", "&nbsp;");
  let x2 = x.replace(/\n\r?/g, "<br />");

//  return s
//    .replace(" ", "&nbsp;")
//    .replace(/\n\r?/g, "<br />");

  return x2;
}

function htmlSpacesToSpaces(s)
{
    return s
      .replace("&nbsp;", " ")
      .replace(/<br\s?\/?>/, "\n");
}

function getNextSpanId()
{
    ++max_span_id;

    return max_span_id;
}

function highlightAnnotationText(containingElement, annotation)
{
  let innerHtml = containingElement.innerHTML;

  const originalText = htmlSpacesToSpaces(containingElement.innerHTML);

  let containingElement_pos = +containingElement.getAttribute("data-pos");
  let annotation_relative_startPos = annotation.starts_at - containingElement_pos;

  let textBeforeSelection = originalText.substring(0, annotation_relative_startPos);
  let s2 = spacesToHtmlSpaces(textBeforeSelection);
  containingElement.innerHTML = s2;

  let span = document.createElement('span');
  span.setAttribute("id", "output-span-" + getNextSpanId());

  span.setAttribute("data-pos", containingElement_pos + textBeforeSelection.length);
  span.setAttribute("class", "highlight");

  span.innerHTML = spacesToHtmlSpaces(annotation.occorrenza);
  containingElement.parentNode.insertBefore(span, containingElement.nextSibling);

  let spanAfterSelection = document.createElement('span');
  spanAfterSelection.setAttribute("id", "output-span-" + getNextSpanId());
  spanAfterSelection.setAttribute("data-pos", containingElement_pos + textBeforeSelection.length + annotation.occorrenza.length);

  let annotation_relative_endPos = annotation_relative_startPos + Math.max(annotation.occorrenza.length - 1, 0);

  spanAfterSelection.innerHTML = spacesToHtmlSpaces(originalText.substring(annotation_relative_endPos+1, originalText.length));
  containingElement.parentNode.insertBefore(spanAfterSelection, span.nextSibling);
}

function getContainingElementByInternalPos(pos)
{
  let outputBox = document.getElementById("output-box");

  for(let i = outputBox.childNodes.length - 1; i >= 0; --i)
  {
    let textElement = outputBox.childNodes[i];

    if(+textElement.dataset.pos <= pos)
    {
      return textElement;
    }
  }

  return null;
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

function clearAnnotationFields()
{
  for(var key in annotation_fields_map)
  {
    annotation_fields_map[key].clearControl(key);
  }
}

function addAnnotationClick()
{
  let annotationValueMap = readValueMapFromPageFields();
  let annotation = new Annotation(annotationValueMap);
let x = document.getSelection().getRangeAt(0).toString();
let x2 = spacesToHtmlSpaces(x);
  highlightAnnotationText(parentElement, annotation);

  annotations.push(annotation);

  $('#annotations-count').text(annotations.length);

  clearAnnotationFields();
}

function readText(name)
{
//  let s = d3.select("#" + name).text();

  let s = d3.select("#" + name).nodes()[0].innerHTML;
  let s2 = htmlSpacesToSpaces(s);

  return s2;
}

function clearText(name)
{
  d3.select("#" + name).text("");
}

function readTextInput(name)
{
//  let control = d3.select("#" + name);
//  let s = control.property("value");
  return d3.select("#" + name).property("value");
//  return s;
}

function clearTextInput(name)
{
  d3.select("#" + name).property("value", "");
}

function readNumber(name)
{
  return +d3.select("#" + name).text();
}

function clearNumber(name)
{
  d3.select("#" + name).text("");
}

function readSelect(name)
{
  return d3.select("#" + name).property("value");
}

function clearSelect(name)
{
  d3.select("#" + name).property("value", "");
}

function readCheckbox(name)
{
  return d3.select("#" + name).property("checked");
}

function clearCheckbox(name)
{
  d3.select("#" + name).property("checked", false);
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
