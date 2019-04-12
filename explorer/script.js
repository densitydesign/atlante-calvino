var text;

function openTextFile(event) {
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
