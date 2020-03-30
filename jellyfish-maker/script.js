"use strict";

init();

var Module = {
	onRuntimeInitialized : function() {}
};
		
function init()
{
  document.getElementById("files").addEventListener("change", handleFileSelect, false);
}

function handleFileSelect(evt)
{
	const reader = new FileReader();

	reader.onload =
		function(evt)
		{
			const text = evt.target.result;

			const lines = text.split(/[\r\n]+/g);
			
			const vec = new Module.StringList();
			lines.forEach(line => vec.push_back(line));
			
			const json = Module.process_data(vec);
			const fileName = "jellyfishes.json";
			
			saveAs(
				new self.Blob([json], {type: "text/plain;charset=utf-8"}),
				fileName);
		};

	reader.readAsText(evt.target.files[0]);
}
