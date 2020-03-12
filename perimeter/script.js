"use strict";

document.getElementById("files").addEventListener("change", handleFileSelect, false);
document.getElementById("download").addEventListener("click", handleDownloadClick, false);
document.getElementById("texts").addEventListener("change", handleTextSelect, false);

class node
{
	constructor(item)
	{
		this._root = null;
		this._children = [];
		this._item = item;
	}

	get root() { return this._root; }
	set root(value) { this._root = value; }
	get item() { return this._item; }
	get children() { return this._children; }

	add_child(n)
	{
		n.root = this;
		n.child_index = this._children.length;
		this._children.push(n);
	}
}

function handleFileSelect(evt)
{
	const reader = new FileReader();

	reader.onload =
		function()
		{
			const levelMap = new Map([
				["uno", 1],
				["due", 2],
				["tre", 3],
				["quattro", 4],
				["cinque", 5]
			]);


			window.csv = d3.csvParse(reader.result, item => {

//				const seqBig = item["SEQ BIG"].split(";");

				return {
					textID : item.ID_racconto,
					textLength : +item["tot caratteri"],
					start : +item.start_motivo,
					end : (+item.end_motivo) + 1,
					level : 1, //levelMap.get(item.livello),
					tag : item["motivo_type"]
				};
			});


//      const csv = d3.csvParse(reader.result);
//      preprocess_csv(csv);

//console.log("csv", csv.filter(d => d.textID === "V021"));
console.log("printing items...");
//print_items(csv.filter(line => line.textID === "XXXX"), "idx");

      const select = document.getElementById("texts");

      if(window.textIDs) Array.from(window.textIDs.values()).forEach(textID => select.remove(0));

      window.textIDs = new Set();

			window.csv.forEach(item => {
        window.textIDs.add(item.textID);
      });

      Array.from(window.textIDs.values()).forEach(textID => {
        const option = document.createElement("option");
        option.text = textID;
        select.add(option);
      });

      console.log("window.textIDs.values()", window.textIDs.values());
/*
			window.texts.forEach(textID => {
if(textID !== "S005") return;
				const csvItems = csv.filter(item => item.textID === textID);

				window.segments = get_segments(csvItems);
console.log("------------------------------");
console.log("textID", textID);
console.log("segments", segments);

        plot_segments(window.segments);

			});
*/
		};

	reader.readAsText(evt.target.files[0]);
}

function handleTextSelect(evt)
{
  const select = document.getElementById("texts");

  const textID = select.value;

	const csvItems = window.csv.filter(item => item.textID === textID);

	window.segments = get_segments(csvItems);
console.log("------------------------------");
console.log("textID", textID);
console.log("segments", segments);

  plot_segments(window.segments);
}

function get_segments(csvItems)
{
	const firstItem = csvItems[0];

	let root = new node({
		textID : firstItem.textID,
		start : 0,
		end : firstItem.textLength,
		level : 0,
		tag : "-",
    child_index : 0
	});

	let current_node = root;

	csvItems.forEach(item => {
		const n = new node(item);
/*
		if(!root)
		{
			root = n;
			n.child_index = 0;
		}
*/
		if(current_node)
		{
			let inserted = false;

			do
			{
				if(current_node.item.level < n.item.level)
				{
					current_node.add_child(n);
					current_node = n;
					inserted = true;
				}
				else if(current_node.item.level === n.item.level && current_node.root)
				{
					current_node.root.add_child(n);
					current_node = n;
					inserted = true;
				}
				else
				{
					current_node = current_node.root;
				}
			} while(!inserted && current_node);
		}
		else
		{
			current_node = n;
		}
	});

	const vertices = [];

	visit2(root);
console.log("tree with panoramas : ", root);

	visit(root, vertices);
console.log("vertices", vertices);


	const processed_vertices = process_vertices(vertices);
	console.log("processed_vertices", processed_vertices);

	const segments = create_segments(processed_vertices);
	console.log("segments", segments);

	const filtered_segments = segments.filter(segment => segment.start !== segment.end + 1);

	return filtered_segments;
}

function visit(n, vertices)
{

//	console.log("begin : ", n.item.tag);
	console.log(`begin : ${n.item.tag} - pos : ${n.item.start}`);
	vertices.push({ tag : n.item.tag, level : n.item.level, type : "start", pos : n.item.start });

	n.children.forEach(child => visit(child, vertices));

	console.log(`end : ${n.item.tag} - pos : ${n.item.end}`);
	vertices.push({ tag : n.item.tag, level : n.item.level, type : "end", pos : n.item.end, panorama : n.panorama ? n.panorama.item.tag : null });
}

function visit2(n)
{
	if(n.root && n.item.end === n.root.item.end) n.panorama = n.root.panorama;
	else if(n.root && n.child_index < n.root.children.length - 1 && n.item.end === n.root.children[n.child_index + 1].item.start) n.panorama = n.root.children[n.child_index + 1];
	else n.panorama = n.root;

	n.children.forEach(child => visit2(child));
}

function process_vertices(vertices)
{
	const processed_vertices = [];

	let overlaps_with_father;
	let overlaps_with_child;

	for(let i = 0; i < vertices.length; ++i)
	{
		overlaps_with_child = i < vertices.length - 1 && vertices[i].pos === vertices[i + 1].pos;
		overlaps_with_father = i > 0 && vertices[i - 1].pos === vertices[i].pos;

		const vertex = vertices[i];

		if(
			(vertex.type === "start" && !overlaps_with_child) ||
			(vertex.type === "end" && !overlaps_with_father))
			processed_vertices.push(vertices[i]);
	}

	return processed_vertices;
}

function create_segments(vertices)
{
	const segments = vertices.slice(0, vertices.length - 1).map((vertex, i) => ({
		tag : vertex.type === "start" ? vertex.tag : vertex.panorama,
		start : vertex.pos,
		end : vertices[i + 1].pos - 1
	}));

	return segments;
}

function plot_segments(segments)
{
  const levels = [
    { color : "#8131F4", name : "morte" },
    { color : "#C890F4", name : "rivelazione" },
    { color : "#0EE2BF", name : "aggressione/scontro" },
    { color : "#0EE2BF", name : "scena erotica" },
    { color : "#0EE2BF", name : "aiuto/salvataggio" },
    { color : "#0EE2BF", name : "incontro femminile" },
    { color : "#0EE2BF", name : "incontro maschile" },
    { color : "#0EE2BF", name : "incontro di gruppo" },
    { color : "#0EE2BF", name : "incontro animale" },
    { color : "#0EE2BF", name : "compito/missione" },
    { color : "#0EE2BF", name : "scommessa" },
    { color : "#0EE2BF", name : "telefonata" },
    { color : "#0EE2BF", name : "rifiuto" },
    { color : "#0EE2BF", name : "offerta" },
    { color : "#0EE2BF", name : "matrimonio" },
    { color : "#BBF9F9", name : "inseguimento/ricerca" },
    { color : "#BBF9F9", name : "fuga" },
    { color : "#BBF9F9", name : "partenza/sparizione" },
    { color : "#BBF9F9", name : "arrivo/ritorno" },
    { color : "#BBF9F9", name : "viaggio" },
    { color : "#00FFB6", name : "successo" },
    { color : "#00FFB6", name : "ostacolo" },
    { color : "#00FFB6", name : "iniziativa/piano" },
    { color : "#1C1CCC", name : "innamoramento" },
    { color : "#053BC4", name : "angoscia/delusione" },
    { color : "#0606F7", name : "illusione/speranza" },
    { color : "#1C4EC9", name : "smarrimento/dubbio" },
    { color : "#DAE6FD", name : "ipotesi" },
    { color : "#172B5E", name : "visione" },
    { color : "#A0BAF9", name : "riflessione" },
    { color : "#0653ED", name : "attesa" },
    { color : "#6E94F4", name : "pausa/sospensione" },
    { color : "#5A5AF9", name : "mistero/assurdità" },
    { color : "#06F9FF", name : "cambiamento" },
    { color : "#06F9FF", name : "guerra" },
    { color : "#06F9FF", name : "città magica" },
    { color : "#06F9FF", name : "situazione" },
    { color : "#EFA625", name : "racconto incastonato" },
    { color : "#FFF800", name : "metanarrazione" },
    { color : "#F2CA22", name : "cornice" },
    { color : "black", name : "titolo" },
    { color : "purple", name : "-" }
  ];

  levels.forEach((d, i) => d.index = i);
/*
  const data = [
    { h : levels[0], start :   0, end : 100, hasVerticalLine : false },
    { h : levels[2], start : 101, end : 300, hasVerticalLine : true  },
    { h : levels[4], start : 301, end : 400, hasVerticalLine : true  },
    { h : levels[3], start : 401, end : 500, hasVerticalLine : true  },
  ];
*/
console.log("about to assign h...");
  segments.forEach((d, i) => {
    d.h = levels.find(dd => dd.name === d.tag);
    d.hasVerticalLine = i !== 0;
  });
console.log("segments", segments);
  const data = segments;

  const svg = d3.select("svg");

  svg.selectAll("*").remove();

  const rectHeight = 10;
  const halfRectHeight = rectHeight / 2;
  const tickDelta = 50;

  const margin = { top : 50, right : 50, bottom : 50, left : 150 };

  const boundingClientRect = svg.node().getBoundingClientRect();

  const width = boundingClientRect.width - margin.left - margin.right;
  const height = boundingClientRect.height - margin.top - margin.bottom;

  const x = d3
    .scaleLinear()
    .domain([d3.min(data, d => d.start), d3.max(data, d => d.end)])
    .range([margin.left, margin.left + width]);

  const y = d3
    .scalePoint()
    .domain(levels.map(d => d.index))
    .range([margin.top, margin.top + height]);

  data.forEach((d, i) => {
if(d.hasVerticalLine && !d.h) console.log("d", d);
    if(d.hasVerticalLine) d.verticalLineHeight = y(d.h.index) - y(data[i - 1].h.index);
  });

  const yAxisCall = d3
    .axisRight(y)
    .tickSize(width)
    .tickFormat(d => levels[d].name);

  const yAxis = svg.append("g");

  // l'yAxis è un g. si scala in verticale colla funzione y, e quindi da essa può recepire
  // il margin verticale; pel margin orizzontale, glielo comunico invece con questo transform:translate(quindi solo orizzontale)
  yAxis
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(yAxisCall)
    .call(g => {
      g
        .selectAll(".tick text")
        .attr("x", -100);
    });

  svg
    .selectAll("rect")
    .data(data)
    .enter()
    .append("rect")
    .attr("x", d => x(d.start))
    .attr("y", d => y(d.h.index) - halfRectHeight)
    .attr("height", rectHeight)
    .attr("width", d => x(d.end) - x(d.start))
    .attr("fill", d => d.h.color);
console.log("adding lines...");
  svg
    .selectAll("line.stepLine")
    .data(data)
    .enter()
    .filter(d => d.hasVerticalLine)
    .append("line")
    .attr("x1", d => x(d.start))
    .attr("y1", d => y(d.h.index) + halfRectHeight * Math.sign(d.verticalLineHeight))
    .attr("x2", d => x(d.start))
    .attr("y2", d => y(d.h.index) - d.verticalLineHeight - halfRectHeight * Math.sign(d.verticalLineHeight))
    .classed("stepLine", true);
console.log("lines added.");
}

function handleDownloadClick(evt)
{
  if(!window.segments) return;

  let s = "tag,start,end\n";

  window.segments.forEach(d => s += `${d.tag},${d.start},${d.end}\n`);

  const fileName = "segments.csv";

  saveAs(
    new self.Blob([s], {type: "text/plain;charset=utf-8"}),
    fileName);
}

function print_items(csv, index)
{
  let s = "";

  csv.forEach((line, i) => {

    s += "{ ";

    if(index) s += index + " : " + i + ", ";

    const entries = Object.entries(line);
//    entries.forEach(entry => s += entry[0] + " : " + entry[1] + ", ");

    s += entries.map(entry => entry[0] + " : " + value_to_field_string(entry[1])).join(", ");

    s += " },\n";
  });

  console.log(s);
}

function value_to_field_string(value)
{
  if(typeof value === "string") return '"' + value + '"';
  else return value;
}
