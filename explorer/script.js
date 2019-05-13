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
let atLeastOneAnnotationAdded;

$('.loaded-a-structure').hide();

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

function openTextFile(event)
{
  let reader = new FileReader();

  reader.onload =
    function()
    {
      text = reader.result;
//      text = text
//        .replace("\n\r", "\n")
//        .replace("\r", "\n");

      source_title = input.files[0].name;

      max_span_id = 0;
      document.getElementById('output-box').innerHTML = "<span id='output-span-" + max_span_id + "' data-pos=0>" + text + "</span>";
      atLeastOneAnnotationAdded = false;

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
            let writeOnControl;

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
                   writeOnControl = writeOnTextInput;
                }
                else
                {
                  readControl = readText;
                  clearControl = clearText;
                  writeOnControl = writeOnText;
                }

                parseTextValue = parseStringField;

                break;
              }
              case "number" :
                readControl = readNumber;

                parseTextValue = parseNumberField;
                clearControl = clearNumber;
                writeOnControl = writeOnNumber;

                break;
              case "select" :
                readControl = readSelect;

                parseTextValue = parseStringField;

                clearControl = clearSelect;
                writeOnControl = writeOnSelect;

                break;
              case "checkbox" :
                readControl = readCheckbox;

                parseTextValue = parseBooleanField;

                clearControl = clearCheckbox;
                writeOnControl = writeOnCheckbox;

                break;
            }

            annotation_fields_map[name] = {
              type: type,
              values: values,
              readControl: readControl,
              parseTextValue: parseTextValue,
              index: index++,
              clearControl: clearControl,
              writeOnControl: writeOnControl
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
      let fileText = reader.result.replaceAll(/\r\n|\r/, "\n");

      let processedFileText = "";
      let insideQuotes = false;

      for(let i = 0; i < fileText.length; ++i)
      {
        let c = fileText[i];

        if(c == "\"") insideQuotes = !insideQuotes;
        else 
          if(insideQuotes && c == '\n') processedFileText += '§';
          else processedFileText += c;
      }

//      let fileLines = fileText.split(/\r?\n|\r/);
      let fileLines = processedFileText.split("\n");

      let dataLines = fileLines
        .slice(1, fileLines.length)
        .filter((line) => { return line.trim() != ""; });

      annotations = dataLines.map(
        function(line)
        {
          line = line.replaceAll("§", "\n");
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

//    if(atLeastOneAnnotationAdded)
//    {
//       currentSelection = document.getSelection().toString();
//    }
//    else
//    {
      currentSelection = document.getSelection().getRangeAt(0).toString();
//    }
//console.log("currentSelection : " + currentSelection);
//let x = document.getSelection().getRangeAt(0).toString();
//console.log("x : " + x);
    if (currentSelection == "") return;

    

    currentSelectionStartRelative = document.getSelection().getRangeAt(0).startOffset;
    let currentSelectionStartAbsolute = currentSelectionStartRelative + (+parentElement.dataset.pos);
    
    currentSelectionEndRelative = document.getSelection().getRangeAt(0).endOffset;
    let currentSelectionEndAbsolute = currentSelectionEndRelative + (+parentElement.dataset.pos);
    

    var found = annotations.find(function(annotation) {
      return (
        annotation.starts_at === currentSelectionStartAbsolute &&
        annotation.ends_at === currentSelectionEndAbsolute);
    });

    if(found != undefined)
    {
      writeValueMapOnPageFields(found);
    }
    else 
    {
      clearAnnotationFields();
      d3.select('#occorrenza').html(spacesToHtmlSpaces(currentSelection));
      d3.select('#starts_at').html(currentSelectionStartAbsolute);
      d3.select('#ends_at').html(currentSelectionEndAbsolute);
    }
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
      let annotationValue = annotation[key];

//      if(key === "occorrenza") annotationValue = annotationValue.replace("\n", "§");
      if(key === "occorrenza") annotationValue = "\"" + annotationValue + "\"";

      s += annotationValue + "\t";
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
  let x = s.replaceAll(" ", "&nbsp;");
  let x2 = x.replaceAll(/\n\r?|\r/g, "<br />");

//  return s
//    .replace(" ", "&nbsp;")
//    .replace(/\n\r?/g, "<br />");

  return x2;
}

function htmlSpacesToSpaces(s)
{
    return s
      .replaceAll("&nbsp;", " ")
      .replaceAll(/<br\s?\/?>/, "\n");
}

function getNextSpanId()
{
    ++max_span_id;

    return max_span_id;
}

function highlightAnnotationText(containingElement, annotation)
{
  if(containingElement == null) return;

  let innerHtml = containingElement.innerHTML;

  const originalText = htmlSpacesToSpaces(containingElement.innerHTML);

  let containingElement_pos = +containingElement.getAttribute("data-pos");
  let annotation_relative_startPos = annotation.starts_at - containingElement_pos;

  let textBeforeSelection = originalText.substring(0, annotation_relative_startPos);
  let s2 = spacesToHtmlSpaces(textBeforeSelection);
//  containingElement.innerHTML = s2;
  containingElement.innerHTML = textBeforeSelection;

  let span = document.createElement('span');
  span.setAttribute("id", "output-span-" + getNextSpanId());

  span.setAttribute("data-pos", containingElement_pos + textBeforeSelection.length);
  span.setAttribute("class", "highlight");

//  span.innerHTML = spacesToHtmlSpaces(annotation.occorrenza);
  span.innerHTML = annotation.occorrenza;

  containingElement.parentNode.insertBefore(span, containingElement.nextSibling);

  let spanAfterSelection = document.createElement('span');
  spanAfterSelection.setAttribute("id", "output-span-" + getNextSpanId());
  spanAfterSelection.setAttribute("data-pos", containingElement_pos + textBeforeSelection.length + annotation.occorrenza.length);

  let annotation_relative_endPos = annotation_relative_startPos + Math.max(annotation.occorrenza.length - 1, 0);

//  spanAfterSelection.innerHTML = spacesToHtmlSpaces(originalText.substring(annotation_relative_endPos+1, originalText.length));
  spanAfterSelection.innerHTML = originalText.substring(annotation_relative_endPos+1, originalText.length);

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

function writeValueMapOnPageFields(valueMap)
{
  for(var key in annotation_fields_map)
  {
    annotation_fields_map[key].writeOnControl(key, valueMap[key]);
  }
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
    let value = annotation_fields_map[key].parseTextValue(fieldValues[i]);

//    if(key === "occorrenza") value = value.replace("§", "\n");
//    if(key === "occorrenza") value = value.substring(1, value.length - 1);
    
    valueMap[key] = value;
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

  atLeastOneAnnotationAdded = true;

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

function writeOnText(name, value)
{
  d3.select("#" + name).text(value);
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

function writeOnTextInput(name, value)
{
  d3.select("#" + name).property("value", value);
}

function readNumber(name)
{
  return +d3.select("#" + name).text();
}

function clearNumber(name)
{
  d3.select("#" + name).text("");
}

function writeOnNumber(name, value)
{
  d3.select("#" + name).text(value);
}

function readSelect(name)
{
  return d3.select("#" + name).property("value");
}

function clearSelect(name)
{
  d3.select("#" + name).property("value", "");
}

function writeOnSelect(name, value)
{
  d3.select("#" + name).property("value", value);
}

function readCheckbox(name)
{
  return d3.select("#" + name).property("checked");
}

function clearCheckbox(name)
{
  d3.select("#" + name).property("checked", false);
}

function writeOnCheckbox(name, value)
{
  d3.select("#" + name).property("checked", value);
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
