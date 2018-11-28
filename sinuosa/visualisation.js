console.log('olè!')

// Draw visualisation

let data;
let articles = [];
let previousPublications = [];
var duration = 500;
let space;
var arc = d3.arc().innerRadius(0);
var line = d3.line()
	.x(function(d) { return d.x; })
	.y(function(d) { return d.y; })
	.curve(d3.curveNatural)

let container = d3.select('#visualisation-container');
let m = window.innerHeight / 6;
let margin = {
	top: m / 3,
	right: m / 1.8,
	bottom: m / 3,
	left: m / 1.8
}
let width = container.node().clientWidth - margin.right - margin.left - 30;
let height = window.innerHeight - margin.top - margin.bottom;
let r = width > height ? height / 10 / 2 / 2.8 : width / 10 / 2 / 2.2;
let r2 = r / 4;
let distributePadding = 3.5;

let svg = d3.select('svg#visualisation')
	.attr('width', width + margin.right + margin.left)
	.attr('height', height + margin.top + margin.bottom);
let g = svg.append('g')
	.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

let y = d3.scalePoint()
	.range([0, height])

let x = d3.scaleLinear()
	.domain([0, 9])
	.range([0, width])
let xInverse = d3.scaleLinear()
	.domain([9, 0])
	.range([0, width])

let col = d3.scaleOrdinal()
	.domain(['romanzo', 'romanzo di racconti dentro una cornice', 'forma ibrida tra romanzo breve e racconto lungo', 'raccolta di racconti con un unico protagonista', 'raccolta di racconti', 'riscrittura', 'raccolta di saggi', 'romanzo fallito o opera non pubblicata', 'progetto incompiuto'])
	.range(['#0490ca', '#00b79e', '#f2d371', '#eb9d69', '#ed7f62', '#707e84', '#9d80bb', '#dfdfdf', '#dfdfdf'])

d3.json('data.json').then(function(json) {
	data = json;
	y.domain(data.map((d) => { return d.id }))
	space = y.step() * 0.75;

	let gArticles = g.append('g').attr('class', 'periodicals');

	let decade = g.selectAll('.decade')
		.data(data, function(d) {
			// console.log(d.id);
			let decadeNumber = '19' + d.id.toString().split('').slice(4, 5).join('') + '0'
			// console.log(decadeNumber);
			d.points = [];
			// this previously added a starting point for drawing the 90deg arc of the decade
			// better to draw it separately
			// if (decadeNumber/10%2 == 0) {
			//   let startingPoint = {
			//     "x": -y.step()/2,
			//     "y": -y.step()/2,
			//     "tipe": "arc90"
			//   }
			//   d.points.push(startingPoint);
			// } else {
			//   let startingPoint = {
			//     "x": xInverse(0) + y.step()/2,
			//     "y": -y.step()/2,
			//     "tipe": "arc90"
			//   }
			//   d.points.push(startingPoint);
			// }

			let _year = '19' + d.id.toString().split('').slice(4, 5).join('')

			for(var ii = 0; ii < 10; ii++) {
				let _year = '19' + d.id.toString().split('').slice(4, 5).join('') + ii;
				// check if there is a volume in this date (ii) and is not an abandoned work
				let ww = d.works.filter(function(e) { return +e.year.toString().split('').slice(3).join('') == ii && e.kind != 'romanzo fallito o opera non pubblicata' && e.kind != 'progetto incompiuto'; })
				if(ww.length) {
					ww.forEach((e) => {
						let point = {
							"year": _year,
							"x": workPosition(e)[0],
							"y": workPosition(e)[1],
							"curve": e.curve,
							"there_is_work": true
						}
						d.points.push(point);
					})
				} else {
					let point = {
						"year": _year,
						"x": workPosition({ "year": decadeNumber + ii })[0],
						"y": workPosition({ "year": decadeNumber + ii })[1],
						"curve": undefined,
						"there_is_work": false
					}
					if(d.id == 'anni60' && ii == 6) {
						point.curve = "bezier";
					}
					if(d.id == 'anni70' && ii == 1) {
						point.curve = "bezier";
					}
					d.points.push(point);
				}
			}

			// this previously added an ending point for drawing the 90deg arc of the decade
			// better to draw it separately
			// if (decadeNumber/10%2 == 0) {
			//   let endingPoint = {
			//     "x": workPosition({"year": decadeNumber+9})[0]+y.step()/2,
			//     "y": workPosition({"year": decadeNumber+9})[1]+y.step()/2,
			//     "tipe": "arc90"
			//   }
			//   d.points.push(endingPoint);
			// } else {
			//   let endingPoint = {
			//     "x": workPosition({"year": decadeNumber+9})[0]-y.step()/2,
			//     "y": workPosition({"year": decadeNumber+9})[1]+y.step()/2,
			//     "tipe": "arc90"
			//   }
			//   d.points.push(endingPoint);
			// }

			if(d.id == 'anni60') {
				d.points.splice(6, 1);
			}

			// now return the identifier for the decade
			return d.id;
		})
		.enter()
		.append('g')
		.attr('class', function(d) { return 'decade ' + d.id; })
		.attr('transform', function(d) { return 'translate(0,' + y(d.id) + ')' })

	let thread = decade.selectAll('.thread')
		.data(function(d, i) {
			d.index = i;
			transformPeriodicals(d);
			return [d.points]
		})
		.enter()
		.append('path')
		.attr('class', 'thread')
		.attr('d', calvinLine)

	let decadeArcStart = decade.selectAll('.decade-arc.start')
		.data(function(d, i) { d.index = i; return [d]; })
		.enter()
		.append('path')
		.attr('class', 'decade-arc start thread')
		.attr('transform', function(d) {
			if(d.id == 'anni70') {
				return 'translate(' + (d.index % 2 == 0 ? 0 : width) + ', ' + (-y.step() / 2 + (r * distributePadding * 0.5)) + ')'
			}
			return 'translate(' + (d.index % 2 == 0 ? 0 : width) + ', ' + (-y.step() / 2) + ')'
		})
		.attr("d", function(d) {
			return decadeArcs(d, 'start', false);
		})

	let decadeArcEnd = decade.selectAll('.decade-arc.end')
		.data(function(d, i) {
			d.index = i;
			return [d];
		})
		.enter()
		.append('path')
		.attr('class', 'decade-arc end thread')
		.attr('transform', function(d) {
			return 'translate(' + (d.index % 2 == 0 ? width : 0) + ', ' + (+y.step() / 2) + ')'
		})
		.attr("d", function(d) {
			return decadeArcs(d, 'end', false)
		})

	let article = gArticles.selectAll('.article')
		.data(articles)
		.enter()
		.append('circle')
		.attr('class', 'article')
		.classed('ghost-node', function(d) { return d.ghostNode })
		.attr('r', 0)
		.attr('cx', function(d) { return d.x })
		.attr('cy', function(d) { return d.y })
		.style('opacity', 1e-6)

	article.transition()
		.duration(duration * 3)
		.delay(function(d, i) { return i * 3; })
		.attr('r', function(d) { return d.r })
		.style('opacity', .75)

	function ticked() {
		article
			.attr("cx", function(d) {
				if(d.x < 0) {
					// d.x = 0
					return d.x += .5
				} else if(d.x > width) {
					// d.x = width
					return d.x -= .5
				}
				return d.x;
			})
			.attr("cy", function(d) { return d.y; });
	}

	let simulationArticle = d3.forceSimulation(articles)
		.force('collision', d3.forceCollide(function(d) { return d3.max([r2 + 3, d.r + 3]) }).iterations(8))
		.force('x', d3.forceX(function(d) { return d.x }).strength(.1))
		.force('y', d3.forceY(function(d) { return d.y }).strength(.6))
		.on("tick", ticked);

	let works = decade.selectAll('.work')
		.data(function(d, i) {
			// compile data for visualising first publications add for line-thread-guide
			// d.points = []
			d.works.forEach((e, i) => {
				if(e.firstPublication) {
					let _y1 = e.year.toString().split('')[2];
					_y1 = 'anni' + _y1 + '0';
					let _y2 = e.firstPublication.toString().split('')[2];
					_y2 = 'anni' + _y2 + '0';
					let obj = {
						"x1": e.year,
						"y1": _y1,
						"x2": e.firstPublication,
						"y2": _y2
					}
					if(e.distributeElement) { obj.distributeElement = e.distributeElement }
					e.previousPublications = obj;
				}
			})
			return d.works;
		})
		.enter()
		.append('g')
		.attr('class', function(d) { return 'work ' + d.id })
		.attr('transform', function(d) {
			_x = workPosition(d)[0]
			_y = workPosition(d)[1]
			return 'translate(' + _x + ',' + _y + ')';
		})

	works.append('circle')
		.attr('r', r)
		.style('fill', 'white')
		.style('stroke', function(d) { return col(d.kind) })

	// works.append('text')
	// 	.attr('class', 'label white-shadow')
	// 	.attr('y', 0)
	// 	.attr('x', 0)
	// 	.attr('transform', function(d) {
	// 		let _x = 0, _y = -r * 2;
	// 		if(d.labelPosition) {
	// 			if(d.labelPosition == "right") { _x = r * 1.3;
	// 				_y = r * 0.25; } else if(d.labelPosition == "left") { _x = -r * 1.3;
	// 				_y = r * 0.25; }
	// 		}
	// 		return 'translate(' + _x + ', ' + _y + ')';
	// 	})
	// 	.style('text-anchor', function(d) {
	// 		if(d.labelPosition == "right") { return 'start' } else if(d.labelPosition == "left") { return 'end' }
	// 	})
	// 	.text(function(d) { return d.label; })
	// 	.call(wrap)

	works.append('text')
		.attr('class', 'label')
		.attr('y', 0)
		.attr('x', 0)
		.attr('transform', function(d) {
			let _x = 0, _y = -r * 2;
			if(d.labelPosition) {
				if(d.labelPosition == "right") { _x = r * 1.6;
					_y = r * 0.25; }
					else if(d.labelPosition == "left") { _x = -r * 1.6;
					_y = r * 0.25; }
					else if (d.labelPosition == "bottom") {
						_y = -_y + r*0.5
					}
			}
			return 'translate(' + _x + ', ' + _y + ')';
		})
		.style('text-anchor', function(d) {
			if(d.labelPosition == "right") { return 'start' } else if(d.labelPosition == "left") { return 'end' }
		})
		.text(function(d) { return d.label; })
		.call(wrap)

	// works.append('text')
	// 	.attr('class', 'label year')
	// 	.classed('hidden', function(d) { return d.kind == 'romanzo fallito o opera non pubblicata' || d.kind == 'progetto incompiuto' })
	// 	.attr('y', r + 10)
	// 	.text(function(d) { return d.year; })

	works.selectAll('.previous-publication')
		.data(function(d) {
			if(d.firstPublication) {
				return [d.previousPublications]
			} else {
				return []
			}
		})
		.enter()
		.append('path')
		.attr('class', 'previous-publication')
		.attr('d', function(d) {
			return previousPublicationsLine(d);
		})

	let yearsLabels = decade.selectAll('.label.year')
		.data(function(d){
			console.log(d.points);
			let nested = d3.nest()
				.key(function(d){return d.year})
				.rollup(function(leaves) {
					console.log(leaves)
					let obj = {
						'x': d3.max(leaves, function(d){ return d.x }),
						'y': d3.max(leaves, function(d){ return d.y }),
						'there_is_work': leaves.there_is_work
					}
					return obj;
				})
				.entries(d.points);

			console.log(nested);
			return nested;
		})
		.enter()
		.append('text')
		.attr('class', 'label year')
		.attr('x', function(d) { console.log(d); return d.value.x })
		.attr('y', function(d) { return d.value.y + r*1.6 })
		.text(function(d){
			return d.key
		})

	activateStorytelling();
});

function transformPeriodicals(data) {
	data.periodicals.forEach((d) => {
		if(d.distributeElement) {
			let positionGN = d.year.toString().split('')[3];
			let _xGN = d.year.toString().split('')[2] % 2 == 0 ? x(positionGN) : xInverse(positionGN);
			let ghostNode = {
				'fx': _xGN,
				'fy': y(data.id),
				'r': r,
				'ghostNode': true,
				'decade': data.id,
				'decadeIndex': data.index
			}
			articles.push(ghostNode);
		}
		for(var i = 0; i < d.amount; i++) {
			let position = d.year.toString().split('')[3];
			let _x = d.year.toString().split('')[2] % 2 == 0 ? x(+position) : xInverse(+position);
			let node = {
				'x': _x,
				'y': y(data.id),
				'r': d3.max([r2 + d3.randomUniform(-r2 / 1, 0)(), 1.5]),
				'decade': data.id,
				'decadeIndex': data.index
			}
			articles.push(node);
		}
	})
}

function previousPublicationsLine(d, open) {
	let positionX1 = d.x1.toString().split('')[3];
	let _x1 = d.x1.toString().split('')[2] % 2 == 0 ? x(positionX1) : xInverse(positionX1);

	let positionX2 = d.x2.toString().split('')[3];
	let _x2 = d.x2.toString().split('')[2] % 2 == 0 ? x(positionX2) : xInverse(positionX2);

	let end_y = d.distributeElement ? r * d.distributeElement * distributePadding : 0;
	end_y += y(d.y1);
	end_y -= r;

	if(open) {
		end_y += space;
	}

	let p = [{ 'x': 0, 'y': 0 - r }, { 'x': _x2 - _x1, 'y': y(d.y2) - end_y }]
	return `M${p[0].x},${p[0].y} C${p[0].x},${p[1].y/2} ${p[1].x},${p[1].y/2} ${p[1].x},${p[1].y}`;
}

function workPosition(d) {
	let position = d.year.toString().split('')[3];
	position = +d.year.toString().split('').slice(3).join('')
	let _x = d.year.toString().split('')[2] % 2 == 0 ? x(position) : xInverse(position);
	let _y = d.distributeElement ? r * d.distributeElement * distributePadding : 0;
	_y += (d.kind == 'romanzo fallito o opera non pubblicata') ? r * 3 : 0;
	_y += (d.kind == 'progetto incompiuto') ? r * 3 : 0;
	return [_x, _y]
}

function decadeArcs(d, position, open) {
	if(position == "start") {
		let myString;
		if(d.index % 2 == 0) {
			myString = arc({
				outerRadius: y.step() / 2,
				startAngle: -Math.PI / 2,
				endAngle: -Math.PI,
				// endAngle: d.index % 2 == 0 ? -Math.PI/2 : Math.PI/2
			}).split(/[A-Z]/);
		} else {
			myString = arc({
				outerRadius: y.step() / 2,
				startAngle: Math.PI / 2,
				endAngle: Math.PI,
				// endAngle: d.index % 2 == 0 ? -Math.PI/2 : Math.PI/2
			}).split(/[A-Z]/);
		}
		if(d.id != 'anni70') {

			// console.log(myString[1].split(','))

			if(open) {
				let px = myString[1].split(',')[0]
				let py = myString[1].split(',')[1] - space
				// console.log(px,py, myString[1])
				return `M${px} ${py} L ${myString[1]} A ${myString[2]}`;
			} else {
				let px = myString[1].split(',')[0]
				let py = myString[1].split(',')[1]
				return `M${px} ${py} L ${myString[1]} A ${myString[2]}`;
				// return "M" + myString[1] + "A" + myString[2]
			}
		} else {

			// x1 = y.step()/2;
			// y1 = 0;
			//
			// x2 = 0;
			// y2 = y.step()/2 + r * distributePadding * 0.5;
			//
			let thisSpace = r * distributePadding * 0.5;

			if(open) {
				let px = myString[1].split(',')[0]
				let py = myString[1].split(',')[1] - space
				// console.log(px,py, myString[1])
				return `M${px} ${py - thisSpace} l 0 ${0} L ${myString[1]} A ${myString[2]}`;
				// return `M${px} ${py} L ${myString[1]} A ${myString[2]}`;
			} else {
				let px = myString[1].split(',')[0]
				let py = myString[1].split(',')[1]
				return `M${px} ${py - thisSpace} l 0 ${py} L ${myString[1]} A ${myString[2]}`;
				// return "M" + myString[1] + "A" + myString[2]
			}

			// // old
			// if (open) {
			//   let px = x1
			//   let py = y1-space
			//   return `M ${px} ${py} L ${x1} ${y1}, C ${x1} ${y1+y.step()/20}, ${x2+y.step()/1.8} ${y2+y.step()/10}, ${x2} ${y2}`
			// } else {
			//   return `M ${x1} ${y1} L ${x1} ${y1}, C ${x1} ${y1+y.step()/20}, ${x2+y.step()/1.8} ${y2+y.step()/10}, ${x2} ${y2}`
			//   // return `M ${x1} ${y1}, C ${x1} ${y1+y.step()/20}, ${x2+y.step()/1.8} ${y2+y.step()/10}, ${x2} ${y2}`
			// }
		}
	} else {
		let myString;
		if(d.index % 2 == 0) {
			myString = arc({
				outerRadius: y.step() / 2,
				startAngle: 0,
				endAngle: Math.PI / 2,
				// endAngle: d.index % 2 == 0 ? -Math.PI/2 : Math.PI/2
			}).split(/[A-Z]/);
		} else {
			myString = arc({
				outerRadius: y.step() / 2,
				startAngle: 0,
				endAngle: -Math.PI / 2,
				// endAngle: d.index % 2 == 0 ? -Math.PI/2 : Math.PI/2
			}).split(/[A-Z]/);
		}
		if(open) {
			return "M" + myString[1] + "A" + myString[2] + "l 0 " + space;
		} else {
			return "M" + myString[1] + "A" + myString[2] + "l 0 0";
		}
	}
}

function wrap(text) {
	text.each(function() {
		var text = d3.select(this),
			words = text.text().split(/_+/);

		text.text(null);

		var word,
			line = [],
			lineNumber = 0,
			lineHeight = 0.55, // ems
			y = text.attr("y"),
			transform = text.attr("transform").replace('translate', '').replace(/\s+/, '').replace(/\(/, '').replace(/\)/, '').split(','),
			dy = parseFloat(text.attr("dy"));

		words.forEach((w, i) => {
			tspan = text.append("tspan")
				.attr("x", 0)
				.attr("y", y)
				.attr("dy", i * lineHeight + 'rem')
				.text(w);

			if(i > 0) {
				transform[1] -= rem2px(i * lineHeight) / 2;
				text.attr('transform', `translate(${transform[0]}, ${transform[1]})`)
			}
		})

	});
}

function rem2px(rem) {
	return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
}
