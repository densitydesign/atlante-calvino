"use strict";

var source_title; // the title corresponding to the injected text
var text;
var parentElement;
var currentSelection;
let currentSelectionStartRelative;
let currentSelectionEndRelative;
let max_span_id = 0;
let annotation_fields_map = new Map();
let annotations;
let atLeastOneAnnotationAdded;
const highlightedElementPrefix = "output-span-";

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
//      document.getElementById('output-box').innerHTML = "<span id='" + highlightedElementPrefix + max_span_id + "' data-pos=0>" + text + "</span>";

      renderText();
      atLeastOneAnnotationAdded = false;

/*
      document.getElementById('output-box').addEventListener( 'dblclick', function(event) {
          event.preventDefault();  
          event.stopPropagation(); 
        },  true //capturing phase!!
      );
*/
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

            let controlFieldIsToBeRegistered = true;

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
              default :
                // in case of special control-fields (aka subselection switches), we don't register controls as others on tsv file (these controls will be used in a special way)
                controlFieldIsToBeRegistered = false;
            }

            if(controlFieldIsToBeRegistered)
            {
              annotation_fields_map.set(name, {
                type: type,
                values: values,
                readControl: readControl,
                parseTextValue: parseTextValue,
                index: index++,
                clearControl: clearControl,
                writeOnControl: writeOnControl
              });
            }

            createControl(name, type, values);
        });

        $('#load-a-structure').hide();
        clearAnnotationFields();
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
/*
      annotations.forEach(annotation => {

        let containingElement = getContainingElementByInternalPos(annotation.starts_at);

        highlightAnnotationText(containingElement, annotation);
      });
*/
      renderText();

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

      if(["currentSelection", "currentSubselection"].includes(values))
      {
        d3
          .select("#info-box")
          .append("label")
          .attr("id", name + "-label")
          .attr("for", name)
          .text(name);

        d3
          .select("#info-box")
          .append("p")
          .attr("id", name)
          .text("");
      }
      else
      {
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
      }

      break;

    case "number":

      if(["currentSelectionStart", "currentSelectionEnd", "currentSubselectionStart", "currentSubselectionEnd"].includes(values))
      {
        d3
          .select("#info-box")
          .append("label")
          .attr("id", name + "-label")
          .attr("for", name)
          .text(name);

        d3
          .select("#info-box")
          .append("span")
          .attr("id", name)
          .text("");        
      }
      else
      {
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
      }

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

    case "subselectionCheckbox":

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

function findAnnotation(starts_at, ends_at)
{
    let foundEntity = annotations.find(function(annotation) {
      return (
        annotation.starts_at === starts_at &&
        annotation.ends_at === ends_at);
    });

    return foundEntity;
}

function findOverlappingAnnotation(starts_at, ends_at)
{
  let foundEntity = annotations.find(function(annotation) {
    return !(
      annotation.ends_at <= starts_at ||
      ends_at <= annotation.starts_at);
  });

  return foundEntity;
}

function selectionIsSaved(starts_at, ends_at)
{
  let foundEntity = findAnnotation(starts_at, ends_at);
  
  return foundEntity != undefined;
}

function selectionOverlapsWithOthers(starts_at, ends_at)
{
  let foundEntity = findOverlappingAnnotation(starts_at, ends_at);

  return foundEntity != undefined;
}

function textSelection()
{
//  console.log(document.getSelection().getRangeAt(0));

  let focusNode = document.getSelection().focusNode;

  if(focusNode == null) return;

  if(document.getSelection().focusNode.parentElement.id.includes(highlightedElementPrefix))
  {
    let subselectionActivated = readCheckbox("subselection");

    if(subselectionActivated)
    {
      parentElement = focusNode.parentElement;

      let subselection = document.getSelection().getRangeAt(0).toString();

      if (subselection == "") return;

      let subselectionStartRelative = document.getSelection().getRangeAt(0).startOffset;    
      let subselectionEndRelative = document.getSelection().getRangeAt(0).endOffset;

      let subselectionEndAbsolute = subselectionEndRelative + (+parentElement.dataset.pos);

      let subselectionStartAbsolute = subselectionEndAbsolute - subselection.length;

      d3.select('#soggetto').html(spacesToHtmlSpaces(subselection));
      d3.select('#soggetto_starts_at').html(subselectionStartAbsolute);
      d3.select('#soggetto_ends_at').html(subselectionEndAbsolute);
    }
    else
    {
      parentElement = focusNode.parentElement;

      currentSelection = document.getSelection().getRangeAt(0).toString();

      if (currentSelection == "") return;    

      currentSelectionStartRelative = document.getSelection().getRangeAt(0).startOffset;    
      currentSelectionEndRelative = document.getSelection().getRangeAt(0).endOffset;

      let currentSelectionEndAbsolute = currentSelectionEndRelative + (+parentElement.dataset.pos);

      let currentSelectionStartAbsolute = currentSelectionEndAbsolute - currentSelection.length;

      let foundEntity = findAnnotation(currentSelectionStartAbsolute, currentSelectionEndAbsolute);

      if(foundEntity != undefined)
      {
        writeValueMapOnPageFields(foundEntity);
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
}

function exportData()
{
  let s = "";
  
  for(var key of annotation_fields_map.keys())
  {
    s += key + "\t";
  }

  s += "\n";

  for(let i = 0; i < annotations.length; ++i)
  {
    let annotation = annotations[i];

    for(var key of annotation_fields_map.keys())
    {
      let annotationValue = annotation[key];

//      if(key === "occorrenza") annotationValue = annotationValue.replace("\n", "§");
      if(["occorrenza", "soggetto"].includes(key)) annotationValue = "\"" + annotationValue + "\"";

      s += annotationValue + "\t";
    }

    s += "\n";
  }

  let fileName = `${source_title.replace(/.txt/g, '')} [${new Date().toJSON().slice(0,16).replace(/T/g,' ')}].tsv`;

  saveAs(
    new self.Blob([s], {type: "text/plain;charset=utf-8"}),
    fileName);

  writeOnCheckbox("subselection", false);
}

function exportDataWithoutOccurrences()
{
  let s = "";
  
  for(var key of annotation_fields_map.keys())
  {
    s += key + "\t";
  }

  s += "\n";

  for(let i = 0; i < annotations.length; ++i)
  {
    let annotation = annotations[i];

    for(var key of annotation_fields_map.keys())
    {
      let annotationValue = annotation[key];

      if(["occorrenza", "soggetto"].includes(key)) continue;

      s += annotationValue + "\t";
    }

    s += "\n";
  }

  let fileName = `${source_title.replace(/.txt/g, '')} [${new Date().toJSON().slice(0,16).replace(/T/g,' ')}] no_occ.tsv`;

  saveAs(
    new self.Blob([s], {type: "text/plain;charset=utf-8"}),
    fileName);

  writeOnCheckbox("subselection", false);
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
  span.setAttribute("id", highlightedElementPrefix + getNextSpanId());

  span.setAttribute("data-pos", containingElement_pos + textBeforeSelection.length);
  span.setAttribute("class", "highlight");

//  span.innerHTML = spacesToHtmlSpaces(annotation.occorrenza);
  span.innerHTML = annotation.occorrenza;

  containingElement.parentNode.insertBefore(span, containingElement.nextSibling);

  let spanAfterSelection = document.createElement('span');
  spanAfterSelection.setAttribute("id", highlightedElementPrefix + getNextSpanId());
  spanAfterSelection.setAttribute("data-pos", containingElement_pos + textBeforeSelection.length + annotation.occorrenza.length);

  let annotation_relative_endPos = annotation_relative_startPos + Math.max(annotation.occorrenza.length - 1, 0);

//  spanAfterSelection.innerHTML = spacesToHtmlSpaces(originalText.substring(annotation_relative_endPos+1, originalText.length));
  spanAfterSelection.innerHTML = originalText.substring(annotation_relative_endPos+1, originalText.length);

  containingElement.parentNode.insertBefore(spanAfterSelection, span.nextSibling);
}

function elementIsHighlighted(element)
{
  if(element == null) return false;

  return element.getAttribute("class") == "highlight";
}

function previousElementIsHighlighted(element)
{
  return elementIsHighlighted(element.previousSibling);
}

function nextElementIsHighlighted(element)
{
  return elementIsHighlighted(element.nextSibling);
}

function merge_element_a_into_b(a, b)
{
  b.innerHTML = a.innerHTML + b.innerHTML;

  b.parentElement.removeChild(a);
}

function merge_into_a_element_b(a, b)
{
  a.innerHTML = a.innerHTML + b.innerHTML;

  a.parentElement.removeChild(b);
}

function merge_into_a_elements_b_c(a, b, c)
{
  a.innerHTML = a.innerHTML + b.innerHTML + c.innerHTML;

  a.parentElement.removeChild(b);
  a.parentElement.removeChild(c);
}

function unhighlightAnnotationText(containingElement)
{
  if(containingElement == null) return;

  let focusNode = document.getSelection().focusNode;

  if(focusNode == null) return;

  if(focusNode.parentElement.id.includes(highlightedElementPrefix))
  {
//    focusNode.parentElement.previousSibling.innerHTML += focusNode.parentElement.innerHTML;
//    focusNode.parentElement.parentElement.removeChild(focusNode.parentElement);

      currentSelection = document.getSelection().getRangeAt(0).toString();
//    }
//console.log("currentSelection : " + currentSelection);
//let x = document.getSelection().getRangeAt(0).toString();
//console.log("x : " + x);
    if (currentSelection == "") return;
    

    let currentSelectionStartRelative = document.getSelection().getRangeAt(0).startOffset;    
    let currentSelectionEndRelative = document.getSelection().getRangeAt(0).endOffset;

    let currentSelectionEndAbsolute = currentSelectionEndRelative + (+parentElement.dataset.pos);
    let currentSelectionStartAbsolute = currentSelectionEndAbsolute - currentSelection.length;

console.log("currentSelectionStartAbsolute : " + currentSelectionStartAbsolute);
console.log("currentSelectionEndAbsolute : " + currentSelectionEndAbsolute);

let element = getContainingElementByInternalPos(currentSelectionStartAbsolute);
console.log("element.id : " + element.id);

    const prevElemHighlighted = previousElementIsHighlighted(element);
    const nextElemHighlighted = nextElementIsHighlighted(element);

    if(prevElemHighlighted && !nextElemHighlighted)
    {
      merge_element_a_into_b(element, element.nextSibling);
    }
    else if(!prevElemHighlighted && nextElemHighlighted)
    {
      merge_into_a_element_b(element.previousSibling, element);
    }
    else if(!prevElemHighlighted && !nextElemHighlighted)
    {
      merge_into_a_elements_b_c(element.previousSibling, element, element.nextSibling);
    }
    else
    {
      element.setAttribute("class", "");
    }
  }
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

function clearSelection()
{
 if (window.getSelection) {window.getSelection().removeAllRanges();}
 else if (document.selection) {document.selection.empty();}
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

function assignToAnnotation(valueMap, annotation)
{
  for(var key in valueMap)
  {
    annotation[key] = valueMap[key];
  }
}

function readValueMapFromPageFields()
{
  let valueMap = {};

  for(var key of annotation_fields_map.keys())
  {
    let value = annotation_fields_map.get(key).readControl(key);
    valueMap[key] = value;
  }

  return valueMap;
}

function writeValueMapOnPageFields(valueMap)
{
  for(var key of annotation_fields_map.keys())
  {
    annotation_fields_map.get(key).writeOnControl(key, valueMap[key]);
  }
}

function readValueMapFromTextLine(line)
{
  let fieldKeys = Array.from(annotation_fields_map.keys());

  let valueMap = {};
  let fieldValues = line.split(/\t/);

  for(let i = 0; i < fieldKeys.length; ++i)
  {
    let key = fieldKeys[i];
    let value = annotation_fields_map.get(key).parseTextValue(fieldValues[i]);

//    if(key === "occorrenza") value = value.replace("§", "\n");
//    if(key === "occorrenza") value = value.substring(1, value.length - 1);
    
    valueMap[key] = value;
  }

  return valueMap;
}

function clearAnnotationFields()
{
  for(var key of annotation_fields_map.keys())
  {
    annotation_fields_map.get(key).clearControl(key);
  }

  writeOnCheckbox("subselection", false);
}

function saveAnnotationClick()
{
  let annotationValueMap = readValueMapFromPageFields();

  if(selectionIsSaved(annotationValueMap.starts_at, annotationValueMap.ends_at))
  {
    let okToProceed = confirm(
      "Si conferma di voler salvare le modifiche all'annotazione tra le posizioni " + 
      annotationValueMap.starts_at + ", " +
      annotationValueMap.ends_at + " - " + 
      annotationValueMap.occorrenza.slice(0, 10) + (annotationValueMap.occorrenza.length > 10 ? "..." : "") +
      " ?");

    if(!okToProceed)
    { 
      alert("Le modifiche NON sono state salvate. Selezionando altro testo, verranno perse. E' ancora possibile salvarle non selezionando altro testo e ripremendo Salva annotazione");

      return;
    }

    let annotation = findAnnotation(annotationValueMap.starts_at, annotationValueMap.ends_at);

    assignToAnnotation(annotationValueMap, annotation);

    renderText();

    alert("Modifiche salvate.");

    writeOnCheckbox("subselection", false);    
  }
  else if(selectionOverlapsWithOthers(annotationValueMap.starts_at, annotationValueMap.ends_at))
  {
    alert("Non è possibile salvare un'annotazione che si sovrappone ad altre già salvate. Si prega di selezionare solo testo non ancora evidenziato.");
  }
  else
  {
    let annotation = new Annotation(annotationValueMap);  

//    highlightAnnotationText(parentElement, annotation);

    annotations.push(annotation);

    renderText();

    atLeastOneAnnotationAdded = true;

    $('#annotations-count').text(annotations.length);

    clearAnnotationFields();    
  }
}

function deleteAnnotationClick()
{
  let annotationValueMap = readValueMapFromPageFields();

  if(selectionIsSaved(annotationValueMap.starts_at, annotationValueMap.ends_at))
  {
    let okToProceed = confirm(
      "Si conferma di voler cancellare l'annotazione tra le posizioni " + 
      annotationValueMap.starts_at + ", " +
      annotationValueMap.ends_at + " - " + 
      annotationValueMap.occorrenza.slice(0, 10) + (annotationValueMap.occorrenza.length > 10 ? "..." : "") +
      " ?");

    if(!okToProceed) return;

    let annotation = findAnnotation(annotationValueMap.starts_at, annotationValueMap.ends_at);

//    unhighlightAnnotationText(parentElement);

    let index = annotations.indexOf(annotation);

    annotations.splice(index, 1);

    $('#annotations-count').text(annotations.length);

    clearAnnotationFields();

    clearSelection();

    renderText();
  }
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

function renderText()
{
/*  
  let annotations = [
    { start : 23, end : 80  },
    { start : 75, end : 87 },
    { start : 60, end : 95 },    
  ];
*/

  let multilevelAnnotations = [];

  annotations.forEach(a => {
    multilevelAnnotations.push({ type : "selection", starts_at : a.starts_at, ends_at : a.ends_at });
    if(a.soggetto_starts_at !== undefined && a.soggetto_ends_at !== undefined)
    {
      multilevelAnnotations.push({ type : "subselection", starts_at : a.soggetto_starts_at, ends_at : a.soggetto_ends_at });
    }
  });

  for(let i = 0; i < multilevelAnnotations.length - 1; ++i)
  {
    multilevelAnnotations[i].next = multilevelAnnotations[i + 1].starts_at;
  }

  let characterMarking = [];

  for(let i = 0; i < text.length; ++i)
  {
    characterMarking.push([]);

    for(let j = 0; j < multilevelAnnotations.length; ++j)
    {
      let annotation = multilevelAnnotations[j];

      if(annotation.starts_at <= i && i < annotation.ends_at)
      {
        characterMarking[i].push(j);
      }
    }
  }

  let characterMarkingKeys = characterMarking.map(d => d.join("-"));

  let ranges = [];
  let currentRangeStart = 0;
  let oldKey = characterMarkingKeys[currentRangeStart];
  let ii;
  let key;
  let n_selections = 0;
  let n_subselections = 0;

  for(ii = 1; ii < characterMarkingKeys.length; ++ii)
  {
    key = characterMarkingKeys[ii];
    
    if(key != oldKey)
    {
      characterMarking[ii - 1].forEach(d => {
        switch(multilevelAnnotations[d].type) 
        {
          case "selection"    :    ++n_selections; break;
          case "subselection" : ++n_subselections; break;
        }
      });

      ranges.push({
        starts_at : currentRangeStart,
        ends_at : ii,
        key : oldKey,
        n_selections : n_selections,
        n_subselections : n_subselections
      });

      oldKey = key;
      currentRangeStart = ii;
      n_selections = 0;
      n_subselections = 0;
    }
  }
console.log("ii-1 : " + (ii-1));
  characterMarking[ii - 1].forEach(d => {
    switch(multilevelAnnotations[d].type)
    {
      case "selection"    :    ++n_selections; break;
      case "subselection" : ++n_subselections; break;
    }
  });

  ranges.push({
    starts_at : currentRangeStart,
    ends_at : ii,
    key : key,
    n_selections : n_selections,
    n_subselection : n_subselections
  });

//  let colors = [ "lightsalmon", "cyan", "orange", "palevioletred", "bisque", "goldenrod", "palegoldenrod" ];

  let textParts = ranges.map((r, i) => {

    let class_tag;
    if(r.key == "")
    {
      class_tag = "";
    }
    else
    {      
      let class_value = "";
console.log("r.n_selections : " + r.n_selections);
console.log("r.n_subselections : " + r.n_subselections);
      if(r.n_selections == 1 && r.n_subselections == 0) class_value = "selection";
      else if(r.n_selections == 0 && r.n_subselections == 1) class_value = "subselection";
      else if(r.n_selections > 1 && r.n_subselections == 0) class_value = "sel_sel";
      else if(r.n_selections == 0 && r.n_subselections > 1) class_value = "subsel_subsel";
      else if(r.n_selections > 0 && r.n_subselections > 0) class_value = "sel_subsel";

//      class_tag = "class='" + (r.type == "selection" ? "selection" : "subselection") + "'");      
      class_tag = "class='" + class_value + "'";
    }

    let s = 
      "<span id='" + highlightedElementPrefix + i + "' data-pos=" + r.starts_at + " " +
      class_tag +
      ">" +
      text.slice(r.starts_at, r.ends_at) + 
      "</span>";
    return s;
  });

  let text2 = text.slice(0, ranges[0].starts_at) + textParts.join("");
  
  console.log(text2);
//  d3.select("#text").html(text2);
  document.getElementById('output-box').innerHTML = text2;
}

document.addEventListener('selectionchange', textSelection);
document.getElementById("save-info").addEventListener("click", saveAnnotationClick);
document.getElementById("delete-info").addEventListener("click", deleteAnnotationClick);
document.getElementById('exportBtn').addEventListener("click", exportData);
document.getElementById('exportWithoutOccurrencesBtn').addEventListener("click", exportDataWithoutOccurrences);
