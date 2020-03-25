"use strict";

init();

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

function init()
{
  document.getElementById("files").addEventListener("change", handleFileSelect, false);
  document.getElementById("texts").addEventListener("change", handleTextSelect, false);
  document.getElementById("activatePattern").addEventListener("click", handlePatternClick, false);

  document.getElementById("lineWidthRange").addEventListener("input", handleLineWidthRangeInput, false);
  window.lineWidthMap = new Map([
    [1, 0.2],
    [2, 0.5],
    [3, 1],
    [4, 1.5],
    [5, 2],
    [6, 4],
    [7, 8],
    [8, 16],
    [9, 32]
  ]);
  refreshLineWidth();

  document.getElementById("lineSamplesPrecisionRange").addEventListener("input", handleLineSamplesPrecisionRangeInput, false);
  window.lineSamplesPrecisionMap = new Map([
    [1, 1],
    [2, 2],
    [3, 3],
    [4, 4],
    [5, 8],
    [6, 10],
    [7, 16],
    [8, 20],
    [9, 32]
  ]);
  refreshLineSamplesPrecision();

  window.levels = get_levels();

  window.margin = { top : 50, right : 50, bottom : 50, left : 150 };

  window.svg = d3.select("svg");

  const boundingClientRect = window.svg.node().getBoundingClientRect();

  window.width = boundingClientRect.width - window.margin.left - window.margin.right;
  window.height = boundingClientRect.height - window.margin.top - window.margin.bottom;

  window.yMapping = d3
    .scalePoint()
    .domain(window.levels.map(d => d.index))
    .range([window.margin.top, window.margin.top + window.height]);
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

			window.raw_csv = d3.csvParse(reader.result, item => {

//				const seqBig = item["SEQ BIG"].split(";");

				return {
					textID : item.ID_racconto,
					textLength : +item["tot caratteri"],
					start : +item.start_motivo,
					end : (+item.end_motivo) + 1,
					level : 1, //levelMap.get(item.livello),
					tag : item["motivo_type"]
				};
			}).sort((a, b) => a.textID > b.textID);

      window.csv = window.raw_csv.filter(item => item.textID);

//      const csv = d3.csvParse(reader.result);
//      preprocess_csv(csv);

//console.log("csv", csv.filter(d => d.textID === "V021"));
console.log("printing items...");
//print_items(csv.filter(line => line.textID === "XXXX"), "idx");

      const select = document.getElementById("texts");

      if(window.textInfos) window.textInfos.forEach(textInfo => select.remove(0));


      const textIDs = Array.from((new Set(window.csv.map(d => d.textID))).values());

      window.textInfos = textIDs.map(textID => {

        const csvItems = window.csv.filter(item => item.textID === textID);

      	const segments = get_segments(
          csvItems,
          window.levels,
          window.margin,
          window.svg,
          window.yMapping,
          window.width);

        const textCode = segments.map(segment => segment.h.code).reduce((textCode, segmentCode) => textCode + segmentCode, "");
console.log("textCode", textCode);
        return {
          textID : textID,
          segments : segments,
          textCode : textCode
        };
      });

      window.textInfos.forEach(textInfo => {
        const option = document.createElement("option");
        option.text = textInfo.textID;
        select.add(option);
      });

      refreshSelectedTextInfosByPattern();

console.log("window.textInfos", window.textInfos);
		};

	reader.readAsText(evt.target.files[0]);
}

function handleTextSelect(evt)
{
//  const segments = prepare_segments(textID);
  refreshSelectedTextInfosByDrop();

  applyFiltering();
}

function refreshSelectedTextInfosByDrop()
{
  const textID = document.getElementById("texts").value;

  const textInfo = window.textInfos.find(textInfo => textInfo.textID === textID);

  window.selectedTextInfos = [ textInfo ];
}

function applyFiltering()
{
  const selectedTextsDiv = document.getElementById("selectedTextsDiv");

  selectedTextsDiv.innerHTML = "";

  if(window.selectedTextInfos.length < window.textInfos.length)
  {
    const text = window.selectedTextInfos.map(textInfo => textInfo.textID).reduce((text, textID) => text + " " + textID, "");

    selectedTextsDiv.innerHTML = text;
  }

  clear_svg();

  plot_axis(
    window.svg,
    window.levels,
    window.margin,
    window.yMapping);

console.log("window.lineWidth", window.lineWidth);
console.log("window.lineSamplesPrecision", window.lineSamplesPrecision);
  redrawSelection(window.selectedTextInfos, window.lineWidth, window.lineSamplesPrecision);
}

function redrawSelection(selectedTextInfos, lineWidth, lineSamplesPrecision)
{
  selectedTextInfos.forEach(textInfo => plotTextDiagram(textInfo, lineWidth, lineSamplesPrecision));
}

function handlePatternClick(evt)
{
//  console.log("pattern", document.getElementById("pattern").value);

  refreshSelectedTextInfosByPattern();

  applyFiltering();
}

function refreshSelectedTextInfosByPattern()
{
  const pattern = document.getElementById("pattern").value;

  const regex = RegExp(pattern);

console.log("pattern", pattern);
  window.selectedTextInfos = window.textInfos.filter(textInfo => regex.test(textInfo.textCode));
console.log("selectedTextInfos", selectedTextInfos);
}

function refreshLineWidth()
{
  const rangeValue = Number.parseInt(document.getElementById("lineWidthRange").value);
  window.lineWidth = window.lineWidthMap.get(rangeValue);
}

function handleLineWidthRangeInput(evt)
{
  refreshLineWidth();

  applyFiltering();
}

function refreshLineSamplesPrecision()
{
  const rangeValue = Number.parseInt(document.getElementById("lineSamplesPrecisionRange").value);
  window.lineSamplesPrecision = window.lineSamplesPrecisionMap.get(rangeValue);
}

function handleLineSamplesPrecisionRangeInput(evt)
{
console.log("handleLineSamplesPrecisionRangeInput");
  refreshLineSamplesPrecision();
console.log("window.lineSamplesPrecision", window.lineSamplesPrecision);
  applyFiltering();
}

function plotTextDiagram(textInfo, lineWidth, lineSamplesPrecision)
{
console.log("------------------------------");
console.log("textInfo", textInfo);

  plot_circles(textInfo);

  prepareColoredLine(textInfo, lineWidth, lineSamplesPrecision);

  plot_texts(textInfo);
}

function clear_svg()
{
  d3.select("svg").selectAll("*").remove();
}

function plot_circles(textInfo)
{
  d3
    .select("svg")
    .selectAll("circle." + textInfo.textID)
    .data(textInfo.segments)
    .enter()
    .append("circle")
    .attr("cx", d => d.x + d.width / 2)
    .attr("cy", d => d.y + d.height / 2)
    .attr("r", 5)
    .attr("stroke", d => d.label ? "red" : "invisible")
    .attr("fill", "transparent");
}

function plot_texts(textInfo)
{
  d3
    .select("svg")
    .selectAll("text." + textInfo.textID)
    .data(textInfo.segments)
    .enter()
    .append("text")
    .attr("x", d => d.cx + 20)
    .attr("y", d => d.cy)
    .attr("fill", "black")
    .attr("text-anchor", "start")
    .attr("transform", d => `rotate(-30,${d.cx},${d.cy})`)
    .text(d => d.label);
}

function prepareColoredLine(textInfo, lineWidth, lineSamplesPrecision)
{
  const lineFunction = d3
    .line()
    .curve(d3.curveMonotoneX)
    .x(d => d.x + d.width / 2)
    .y(d => d.y + d.height / 2);

  const lineGraph = d3
    .select("svg")
    .append("path")
    .attr("d", lineFunction(textInfo.segments))
    .classed("line1", true);

  const colorIntervals = createColorIntervals(textInfo.segments);
  const colorInterpolators = createColorInterpolators(colorIntervals);

  const intervalInterpolatorMap = colorIntervals.map((d, i) => [d, colorInterpolators[i]]);

  plotColoredLine(intervalInterpolatorMap, lineWidth, lineSamplesPrecision);
}

function get_levels()
{
  const levels = [
    { color : "#8131F4", code : "a", name : "morte" },
    { color : "#C890F4", code : "b", name : "rivelazione" },
    { color : "#0EE2BF", code : "c", name : "aggressione/scontro" },
    { color : "#0EE2BF", code : "d", name : "scena erotica" },
    { color : "#0EE2BF", code : "e", name : "aiuto/salvataggio" },
    { color : "#0EE2BF", code : "f", name : "incontro femminile" },
    { color : "#0EE2BF", code : "g", name : "incontro maschile" },
    { color : "#0EE2BF", code : "h", name : "incontro di gruppo" },
    { color : "#0EE2BF", code : "i", name : "incontro animale" },
    { color : "#0EE2BF", code : "j", name : "compito/missione" },
    { color : "#0EE2BF", code : "k", name : "scommessa" },
    { color : "#0EE2BF", code : "l", name : "telefonata" },
    { color : "#0EE2BF", code : "m", name : "rifiuto" },
    { color : "#0EE2BF", code : "n", name : "offerta" },
    { color : "#0EE2BF", code : "o", name : "matrimonio" },
    { color : "#BBF9F9", code : "p", name : "inseguimento/ricerca" },
    { color : "#BBF9F9", code : "q", name : "fuga" },
    { color : "#BBF9F9", code : "r", name : "partenza/sparizione" },
    { color : "#BBF9F9", code : "s", name : "arrivo/ritorno" },
    { color : "#BBF9F9", code : "t", name : "viaggio" },
    { color : "#00FFB6", code : "u", name : "successo" },
    { color : "#00FFB6", code : "v", name : "ostacolo" },
    { color : "#00FFB6", code : "w", name : "iniziativa/piano" },
    { color : "#1C1CCC", code : "x", name : "innamoramento" },
    { color : "#053BC4", code : "y", name : "angoscia/delusione" },
    { color : "#0606F7", code : "z", name : "illusione/speranza" },
    { color : "#1C4EC9", code : "A", name : "smarrimento/dubbio" },
    { color : "#DAE6FD", code : "B", name : "ipotesi" },
    { color : "#172B5E", code : "C", name : "visione" },
    { color : "#A0BAF9", code : "D", name : "riflessione" },
    { color : "#0653ED", code : "E", name : "attesa" },
    { color : "#6E94F4", code : "F", name : "pausa/sospensione" },
    { color : "#5A5AF9", code : "G", name : "mistero/assurdità" },
    { color : "#06F9FF", code : "H", name : "cambiamento" },
    { color : "#06F9FF", code : "I", name : "guerra" },
    { color : "#06F9FF", code : "J", name : "città magica" },
    { color : "#06F9FF", code : "K", name : "situazione" },
    { color : "#EFA625", code : "L", name : "racconto incastonato" },
    { color : "#FFF800", code : "M", name : "metanarrazione" },
    { color : "#F2CA22", code : "N", name : "cornice" },
    { color : "black",   code : "O", name : "titolo" },
    { color : "white",   code : "P", name : "missing" },
    { color : "purple",  code : "Q", name : "-" }
  ];

  levels.forEach((d, i) => d.index = i);

  return levels;
}

function get_segments(
  csvItems,
  levels,
  margin,
  svg,
  yMapping,
  width)
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
	});

	const vertices = [];

	visit2(root);
console.log("tree with panoramas : ", root);

	visit(root, vertices);
console.log("vertices", vertices);

	const processed_vertices = process_vertices(vertices);
console.log("processed_vertices", processed_vertices);

	const segments = create_segments(processed_vertices, levels, margin, width, yMapping);
console.log("segments", segments);

  return segments;
}

function visit(n, vertices)
{

//	console.log("begin : ", n.item.tag);
//console.log(`begin : ${n.item.tag} - pos : ${n.item.start}`);
	vertices.push({ tag : n.item.tag, level : n.item.level, type : "start", pos : n.item.start });

	n.children.forEach(child => visit(child, vertices));

//console.log(`end : ${n.item.tag} - pos : ${n.item.end}`);
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

function create_segments(vertices, levels, margin, width, yMapping)
{
	const unfiltered_segments = vertices.slice(0, vertices.length - 1).map((vertex, i) => {

    const start = vertex.pos;
    const end = vertices[i + 1].pos - 1;

    return {
  		tag : vertex.type === "start" ? vertex.tag : vertex.panorama,
  		start : start,
  		end : end
    };
  });
//console.log("unfiltered_segments", unfiltered_segments);

	let segments = unfiltered_segments.filter(segment => segment.start !== segment.end + 1);
//console.log("segments", segments);

  const default_h = levels.find(dd => dd.name === "missing");

  // add h level info and vertical line flag
  segments.forEach((d, i) => {
    d.h = levels.find(dd => dd.name === d.tag);
    if(!d.h) d.h = default_h;

    d.hasVerticalLine = i !== 0;
  });

  // remove initial segments with "-" or "titolo" markers
  if(segments[0].tag === "-") segments = segments.slice(1);
  if(segments[0].tag === "titolo") segments = segments.slice(1);
//console.log("segments 320", segments);
  // add terminal items for creating horizontal terminal line parts
  const firstItem = Object.assign({}, segments[0]);
  firstItem.start = 0;
  firstItem.end = 0;
  segments.unshift(firstItem);

  if(segments[segments.length - 1].tag === "-") segments.splice(segments.length - 1);

  const lastItem = Object.assign({}, segments[segments.length - 1]);
  lastItem.start = lastItem.end;
  segments.push(lastItem);
//console.log("segments with lastItem", segments);

  const xMapping = d3
    .scaleLinear()
    .domain([d3.min(segments, d => d.start), d3.max(segments, d => d.end)])
    .range([margin.left, margin.left + width]);

  const rectHeight = 10;
  const halfRectHeight = rectHeight / 2;

  segments.forEach((d, i) => {
//if(d.hasVerticalLine && !d.h) console.log("d", d);

    d.x = xMapping(d.start);
    d.y = yMapping(d.h.index) - halfRectHeight;
    d.height = rectHeight;
    d.width = xMapping(d.end) - xMapping(d.start);
    d.cx = d.x + d.width / 2;
    d.cy = d.y + d.height / 2;
    d.label = i !== 1 && i != segments.length - 2 ? d.tag : "";

    if(d.hasVerticalLine && i > 0)
    {
//console.log("i", i);
      d.verticalLineHeight = yMapping(d.h.index) - yMapping(segments[i - 1].h.index);
      d.x1 = xMapping(d.start);
      d.y1 = yMapping(d.h.index) + halfRectHeight * Math.sign(d.verticalLineHeight);
      d.x2 = xMapping(d.end);
      d.y2 = yMapping(d.h.index) - d.verticalLineHeight - halfRectHeight * Math.sign(d.verticalLineHeight);
      d.middle_x = (d.x1 + d.x2) / 2;
      d.stepLine = true;
//console.log("d", d);
    }
  });
//console.log("finally segments", segments);
	return segments;
}

function plot_axis(
  svg,
  levels,
  margin,
  yMapping)
{
  const yAxis = svg.append("g");

  const yAxisCall = d3
    .axisRight(yMapping)
    .tickSize(0)
    .tickFormat(d => levels[d].code + " " + levels[d].name);

  // l'yAxis è un g. si scala in verticale colla funzione y, e quindi da essa può recepire
  // il margin verticale; pel margin orizzontale, glielo comunico invece con questo transform:translate(quindi solo orizzontale)
  yAxis
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(yAxisCall)
    .call(g => g.selectAll(".tick text").attr("x", -100));
}

function plot_segments(
  segments,
  svg,
  levels,
  margin,
  yMapping,
  width)
{
//  if(data[data.length - 1].tag === "-") data.splice(0, data.length - 1);

  const yAxis = svg.append("g");

  const yAxisCall = d3
    .axisRight(yMapping)
    .tickSize(width)
    .tickFormat(d => levels[d].name);

  // l'yAxis è un g. si scala in verticale colla funzione y, e quindi da essa può recepire
  // il margin verticale; pel margin orizzontale, glielo comunico invece con questo transform:translate(quindi solo orizzontale)
  yAxis
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(yAxisCall)
    .call(g => g.selectAll(".tick text").attr("x", -100));

  svg
    .selectAll("rect")
    .data(segments)
    .enter()
    .append("rect")
    .attr("x", d => d.x)
    .attr("y", d => d.y)
    .attr("height", d => d.height)
    .attr("width", d => d.width)
    .attr("stroke", "red")
    .attr("fill", d => d.h.color);
console.log("adding lines...");
  svg
    .selectAll("line.stepLine")
    .data(segments)
    .enter()
    .filter(d => d.hasVerticalLine)
    .append("line")
    .attr("x1", d => d.x1)
    .attr("y1", d => d.y1)
    .attr("x2", d => d.x1) // IMPORTANT : this IS d.x1 and NOT d.x2. it's taking the correct value!
    .attr("y2", d => d.y2)
    .classed("stepLine", d => d.stepLine);
console.log("lines added.");
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

////////////////////////////////

function createColorIntervals(segments)
{
  const pointInfos = segments.map(d => ({ middle_x : d.middle_x, color : d.h.color }));

  pointInfos[0].middle_x = 0;
console.log("pointInfos", pointInfos);
  const colorIntervals = make_pairs_of_subsequent_items(pointInfos);
console.log("colorIntervals", colorIntervals);

  return colorIntervals;
}

function createColorInterpolators(colorIntervals)
{
  const renderingIntervals = [
    ["yellow", "red"],
    ["black", "green"],
//    ["transparent", "transparent"],
    ["purple", "blue"]
 //   ["transparent", "transparent"]
  ];
  const colorInterpolators = colorIntervals.map((colorInterval, i) => {
return    d3.interpolate(colorInterval[0].color, colorInterval[1].color);
//    d3.interpolate("yellow", "red"));

//    const renderingInterval = renderingIntervals[i % 3];
//    return d3.interpolate(...renderingInterval);
  });

//    d3.interpolate(

  return colorInterpolators;
}

function make_pairs_of_subsequent_items(items)
{
  const pairs = [];

  let i;

  for(i = 0; i < items.length - 1; ++i)
  {
    pairs.push([items[i], items[i + 1]]);
  }

  return pairs;
}

function plotColoredLine(intervalInterpolatorMap, lineWidth, lineSamplesPrecision)
{
//  const color = d3.interpolateRainbow;
//  const color = d3
console.log("intervalInterpolatorMap", intervalInterpolatorMap);
  const color = function(x) {
//    const matchingPair = intervalInterpolatorMap.find(d => d[0][0].middle_x <= x && x < d[0][1].middle_x);
    let matchingPair = intervalInterpolatorMap.find(d => d[0][0].middle_x <= x && x < d[0][1].middle_x);
    if(!matchingPair) matchingPair = intervalInterpolatorMap[0];
//console.log("x", x);
//console.log("matchingPair", matchingPair);
    const ratio = (x - matchingPair[0][0].middle_x) / (matchingPair[0][1].middle_x - matchingPair[0][0].middle_x);
//console.log("ratio", ratio);
    return matchingPair[1](ratio);
  };

  const svg = d3.select("svg");

  const path = d3.select(".line1").remove();

//  const samplesPrecision = 16; //8;

  const data = quads(samples(path.node(), lineSamplesPrecision));
//console.log("data", data);

//  const lineWidth = 0.5; //32;

  svg
    .selectAll(".line1")
    .data(data)
    .enter()
    .append("path")
    .style("fill", function(d) {
      return color(d[1][0]);
    })
    .style("stroke", function(d) {
//console.log("-----------");
//console.log("d", d);
//const cc = color(d[1][0]);
//console.log("cc", cc);
      return color(d[1][0]);
    })
    .attr("d", function(d) { return lineJoin(d[0], d[1], d[2], d[3], lineWidth); });
}

// sample the SVG  path uniformly with the specified precision.
function samples(path, precision)
{
  const n = path.getTotalLength();
  const t = [0];
  let i = 0;
  const dt = precision;

  while((i += dt) < n) t.push(i);

  t.push(n);

  return t.map(function(tt) {
//console.log("getting p...");
//console.log("path", path);
    const p = path.getPointAtLength(tt);
//console.log("p", p);
//console.log("tt", tt);
    const a = [p.x, p.y];
    a.t = tt / n;

    return a;
  });
}

// compute quads of adjacent points [p0, p1, p2, p3].
function quads(points)
{
  return d3
    .range(points.length - 1)
    .map(function(i) {
      const a = [points[i - 1], points[i], points[i + 1], points[i + 2]];
      a.t = (points[i].t + points[i + 1].t) / 2;

      return a;
    });
}

// compute stroke outline for segment p12
function lineJoin(p0, p1, p2, p3, width)
{
  const u12 = perp(p1, p2);
  const r = width / 2;

  let a = [p1[0] + u12[0] * r, p1[1] + u12[1] * r];
  let b = [p2[0] + u12[0] * r, p2[1] + u12[1] * r];
  let c = [p2[0] - u12[0] * r, p2[1] - u12[1] * r];
  let d = [p1[0] - u12[0] * r, p1[1] - u12[1] * r];

  if(p0)
  {
    // clip ad and dc using average of u01 and u12
    const u01 = perp(p0, p1);
    const e = [
      p1[0] + u01[0] + u12[0],
      p1[1] + u01[1] + u12[1]
    ];

    a = lineIntersect(p1, e, a, b);
    d = lineIntersect(p1, e, d, c);
  }

  if(p3)
  {
    // clip ab and dc using average of u12 and u23
    const u23 = perp(p2, p3);
    const e = [
      p2[0] + u23[0] + u12[0],
      p2[1] + u23[1] + u12[1]
    ];

    b = lineIntersect(p2, e, a, b);
    c = lineIntersect(p2, e, d, c);
  }

  return "M" + a + "L" + b + " " + c + " " + d + "Z";
}

// compute intersection of two infinite lines ab and cd
function lineIntersect(a, b, c, d)
{
  const x1 = c[0], x3 = a[0], x21 = d[0] - x1, x43 = b[0] - x3;
  const y1 = c[1], y3 = a[1], y21 = d[1] - y1, y43 = b[1] - y3;
  const ua = (x43 * (y1 - y3) - y43 * (x1 - x3)) / (y43 * x21 - x43 * y21);

  return [x1 + ua * x21, y1 + ua * y21];
}

// compute unit vector perpendicular to p01
function perp(p0, p1)
{
  const u01x = p0[1] - p1[1];
  const u01y = p1[0] - p0[0];
  const u01d = Math.sqrt(u01x * u01x + u01y * u01y);

  return [u01x / u01d, u01y / u01d];
}
