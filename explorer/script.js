var text;

function openTextFile(event) {
  var input = event.target;
  var reader = new FileReader();
  reader.onload = function() {
    text = reader.result;

//    document.getElementById('output-box').innerHTML = text;
    document.getElementById('output-box').innerHTML = "<div id='output-block-1' data-pos=100>" + text + "</div>";

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

  let parentElement = document.getSelection().focusNode.parentElement;

//  if (document.getSelection().focusNode.parentElement.id.contains('output-block')) {
  if (parentElement.id.includes('output-block')) {
    let currentSelection = document.getSelection().toString();
    let currentSelectionStart = document.getSelection().getRangeAt(0).startOffset + (+parentElement.dataset.pos);
    let currentSelectionEnd = document.getSelection().getRangeAt(0).endOffset + (+parentElement.dataset.pos);
    d3.select('#current-selection').html(currentSelection);
    d3.select('#current-selection-start').html(currentSelectionStart);
    d3.select('#current-selection-end').html(currentSelectionEnd);
  }
}

function addInfoClick() {
  alert("ciao!");
}

document.addEventListener('selectionchange', textSelection);
document.getElementById("add-info").addEventListener("click", addInfoClick);
