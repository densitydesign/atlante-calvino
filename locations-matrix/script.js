var container = d3.select('#matrix-container');
var svg = d3.select('#matrix');
var g = svg.append('g');
var link = g.append('g').classed('links', true).selectAll('.link');
var hull = g.append('g').classed('hulls', true).selectAll('.hull');
var node = g.append('g').classed('nodes', true).selectAll('.node');
var label = g.append('g').classed('labels', true).selectAll('.label');

var categories = [
	'generico_non_terrestre',
	'nominato_non_terrestre',
	'nominato_terrestre',
	'generico_terrestre',
	'inventato',
	'no_ambientazione'
]
var minRadius = 3;

var w = container.node().getBoundingClientRect().width;
var h = container.node().getBoundingClientRect().height;
var margin = {
	'top': 50,
	'right': 50,
	'bottom': 50,
	'left': 50
}

svg.attr('width', w)
	.attr('height', h);

var x = d3.scaleLinear()
	.range([0 + margin.left, w - margin.right]);

var y = d3.scalePoint()
	.range([0 + margin.top, h - margin.bottom]);

var r = d3.scalePow().exponent(0.5)
	.range([2.5,25])

var color = d3.scaleOrdinal()
	.domain(categories)
	.range(d3.schemeCategory10)

var nodes = [],
	hullsData = [],
	hulls = [],
	links = [];

var simulation = d3.forceSimulation(nodes)
	// .force("charge", d3.forceManyBody().strength(-0.5))
	.force("link", d3.forceLink(links)
		.strength(function(d) { return d.kind == 'same_text' ? 0 : 0.2; })
		.distance(20)
		.id(function(d) { return d.id; })
	)
	.force("x", d3.forceX(function(d) { return d.x })
		.strength(function(d) { return d.part_of == '' ? 0.7 : 0; })
	)
	.force("y", d3.forceY(function(d) { return d.y })
		.strength(function(d) { return d.part_of == '' ? 0.7 : 0; })
	)
	.force("collision", d3.forceCollide(function(d){
			return d.opened ? r(1)+2 : r(d.totalSubNodes + 1)+2
		})
		.iterations(4)
		.strength(.5)
	)
	.on("tick", ticked);

function restart() {
	// Apply the general update pattern to the nodes.
	node = node.data(nodes, function(d) { return d.id; });
	node.exit().remove();
	node = node.enter().append("circle")
		.classed('node', true)
		.attr("fill", function(d) { return color(d.category) })
		.attr('stroke', function(d) { if(d.part_of) return 'black' })
		.attr("cx", function(d) { return d.x })
		.attr("cy", function(d) { return d.y })
		.on('mouseenter', function(d){
			node.filter(function(e){ return e.source != d.source; }).style('opacity', 0.2);
			label.filter(function(e){ return d.id == e.id }).style('display', 'block');
		})
		.on('mouseleave', function(d){
			node.style('opacity', 1);
			label.style('display', 'none');
		})
		.on('click', d => {
			if (d.opened) {
				d.opened = false;
				console.log('Collect all sub-nodes', d.subNodes);
				let toRemove = d.subNodes.map( d => d.id)
				let filtered = nodes.filter( el => {
					return !toRemove.includes( el.id );
				})
				// remove this hull
				hullsData = hullsData.filter(function(h){
					return h[0].id != d.id
				})
				// calculate graph
				var graph = calculateNetwork(filtered)
				nodes = graph.nodes;
				links = graph.edges;
				restart();
				// important to return here so to not do the following instructions
				return;
			}
			// console.log(d.label, d.id);
			if (d.subNodes && d.subNodes.length){
				console.log('There are nodes to expand: ', d.subNodes.length)
				d.subNodes.forEach(function(subNode){
					subNode.x = d.x;
					subNode.y = d.y;
				})
				d.opened = true;
				// Make convex hull
				var thisHullNodes = [d].concat(d.subNodes); // first element in array is always the one opened, so we can use its ID as identifier for the convex hull
				console.log('this hull nodes', thisHullNodes);
				hullsData.push(thisHullNodes);
				// calculate Graph
				var augmentedNodes = nodes.concat(d.subNodes);
				var graph = calculateNetwork(augmentedNodes);
				nodes = graph.nodes;
				links = graph.edges;
				restart();
			} else {
				console.log('No nodes to expand')
			}
		})
		.call(d3.drag().on("drag", dragged))
		.merge(node)
		.style('cursor', function(d){
			return d.subNodes && d.subNodes.length ? 'pointer' : 'auto';
		})
		.attr("r", function(d){ return d.opened ? r(1) : r(d.totalSubNodes + 1) }) // +1 means plus itself

	// Apply the general update pattern to the links.
	link = link.data(links, function(d) {
		return d.source.id + "-" + d.target.id;
	});
	link.exit().remove();
	link = link.enter().append("line")
		.classed('link', true)
		.classed('part-of', function(d) { return d.kind == 'part_of' })
		.on('click', d => console.log(d))
		.merge(link);

	// Apply the general update pattern to the labels.
	label = label.data(nodes, function(d) { return d.id; });
	label.exit().remove();
	label = label.enter().append("text")
		.classed('label', true)
		.attr('text-anchor', 'middle')
		.text(function(d){return d.label})
		.merge(label);

	// Apply the general update pattern to the convex hulls.
	hull = hull.data(hullsData, function(d) {
		return d[0].id;
	});
	hull.exit().remove();
	hull = hull.enter().append("path")
		.classed('hull', true)
		.attr('fill', function(d){
			return color(d[0].category)
		})
		.style('opacity', .5)
		.merge(hull);


	// Update and restart the simulation.
	simulation.nodes(nodes);
	simulation.force("link").links(links);
	simulation.alpha(1).restart();
}

function ticked() {
	node.attr("cx", function(d) { return d.x; })
		.attr("cy", function(d) { return d.y; });

	label.attr("x", function(d) { return d.x; })
		.attr("y", function(d) { return d.y; });

	link.attr("x1", function(d) { return d.source.x; })
		.attr("y1", function(d) { return d.source.y; })
		.attr("x2", function(d) { return d.target.x; })
		.attr("y2", function(d) { return d.target.y; });

	hull.attr("d", function(d){
		// console.log(d);
		if (d.length < 3) {
			// console.log('just 2 points, ipmossible to create hull');
			return;
		}
		let thisHullPoints = d.map( d => { return [d.x, d.y] });
		// console.log(thisHullPoints);
		let thisHullPath = "M" + d3.polygonHull(thisHullPoints).join("L") + "Z";
		// console.log(thisHullPath);
		return thisHullPath;
	})
}

Promise.all([
	d3.tsv('data.tsv')
]).then(function(data) {
	var locations = data[0]//.filter(function(d) { return +d.year >= 1965 && +d.year <= 1980 });

	x.domain(d3.extent(locations, function(d) { return d.year }));
	y.domain(categories);

	locations.forEach(function(d) { if(!d.id) { d.id = d['data.id'] } })
	locations = locations.map(function(d) {
		var obj = {
			'id': d.id,
			'label': d['Occorrenza'],
			'part_of': d['Parte di ID'],
			'source': d['Fonte'],
			'year': +d.year,
			'category': d['Categoria'],
			'totalSubNodes':0,
			// set x and y to make nodes appera in the precise position
			'x': x(d.year),
			'y': y(d['Categoria'])
		}
		return obj
	})

	locations = handleHierarchies(locations);
	let graph = calculateNetwork(locations);
	nodes = graph.nodes;
	links = graph.edges;
	restart();
})

function handleHierarchies(nodes) {
	// calculate hierarchies of sub-nodes
	let hierarchies = d3.nest()
		.key(function(d){ return d.part_of })
		.entries(nodes);

	hierarchies
		.filter(function(d){ return d.key == '' })[0]
		.values.forEach(function(d){
			var part_of_d = hierarchies.find(function(e){ return e.key == d.id })
			if (part_of_d) {
				// console.log('LVL 0',d.id, d.label, 'is parent of', part_of_d.values.length);
				d.subNodes = part_of_d.values;
				d.totalSubNodes = part_of_d.values.length

				part_of_d.values.forEach(function(e){
					var part_of_e = hierarchies.find(function(f){ return f.key == e.id })
					if (part_of_e) {
						// console.log('LVL 1',e.id, e.label, 'is parent of', part_of_e.values.length);
						e.subNodes = part_of_e.values
						e.totalSubNodes = part_of_e.values.length
						d.totalSubNodes += e.totalSubNodes

						part_of_e.values.forEach(function(f){
							var part_of_f = hierarchies.find(function(g){ return g.key == f.id})
							if (part_of_f) {
								// console.log('LVL 2', f.id, f.label, 'is parent of', part_of_f.values.length)
								f.subNodes = part_of_f.values
								f.totalSubNodes = part_of_f.values.length
								d.totalSubNodes += f.totalSubNodes

								part_of_f.values.forEach(function(g){
									var part_of_g = hierarchies.find(function(h){ return h.key == g.id })
									if (part_of_g) {
										// console.log('LVL 3', g.id, g.label, 'is parent of', part_of_g.values.length)
										g.subNodes = part_of_g.values
										g.totalSubNodes = part_of_g.values.length
										d.totalSubNodes += f.totalSubNodes

									}
								})
							}
						})
					}
				})
			}
		})
	// console.log(hierarchies);
	// set domain of the radii scale
	r.domain([1,d3.max(nodes, function(d){ return d.totalSubNodes })])
	// return array of hierarchical nodes
	return hierarchies.filter(function(d){ return d.key == '' })[0].values;
}

function calculateNetwork(nodes) {
	// console.log('calculate network')

	// create the array of edges
	var edges = []
	// base edges on works co-occurrences of places
	var sources = d3.nest()
		.key(function(d) { return d.source })
		.entries(nodes)
		.forEach((d) => {

            //removing links that are not hierarchical increase performance A LOT
			d.values.filter(function(e) {
				return e.part_of == '';
			}).forEach((n, i) => {
				if(i < d.values.length - 1) {
					for(var k = i + 1; k <= d.values.length - 1; k++) {
						var obj = {}
						obj = {
							'source': n.id,
							'target': d.values[k].id,
							'volume': d.key,
							// 'year': n.year,
							'source_part_of': n.part_of,
							'kind': 'same_text'
						}
						edges.push(obj);
					}
				}
			})

			d.values.filter(function(e) {
				return e.part_of != '';
			}).forEach((n, i) => {
				var obj = {}
				obj = {
					'source': n.id,
					'target': n.part_of,
					'volume': d.key,
					// 'year': n.year,
					'source_part_of': n.part_of,
					'kind': 'part_of'
				}
				edges.push(obj);
			})
		})

	return { 'nodes': nodes, 'edges': edges }
}

function getRandomArbitrary(min, max) {
	return Math.random() * (max - min) + min;
}

function dragged(d) {
    d.x = d3.event.x, d.y = d3.event.y;
    d3.select(this).attr("cx", d.x).attr("cy", d.y);
    link.filter(function(l) { return l.source === d; }).attr("x1", d.x).attr("y1", d.y);
    link.filter(function(l) { return l.target === d; }).attr("x2", d.x).attr("y2", d.y);
	simulation.alpha(1).restart();
  }