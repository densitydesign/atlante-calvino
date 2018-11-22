console.log('olè!')

// Draw visualisation

let data;
let articles = [];
var duration = 500;
var arc = d3.arc().startAngle(0).innerRadius(0);
let container = d3.select('#visualisation-container');
let m = window.innerHeight / 7;
let margin = {
	top: m / 2,
	right: m,
	bottom: m / 2,
	left: m
}
let width = container.node().clientWidth - margin.right - margin.left - 30;
let height = window.innerHeight - margin.top - margin.bottom;
let r = width / 10 / 2 / 2;
let r2 = r / 4;
let distributePadding = 3.5;

let svg = d3.select('svg#visualisation')
	.attr('width', width + margin.right + margin.left)
	.attr('height', height + margin.top + margin.bottom);
let g = svg.append('g')
	.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

let y = d3.scalePoint()
	.range([0, height])

let x = d3.scalePoint()
	.domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
	.range([0, width])
let xInverse = d3.scalePoint()
	.domain([9, 8, 7, 6, 5, 4, 3, 2, 1, 0])
	.range([0, width])

let col = d3.scaleOrdinal()
	.domain(['romanzo', 'romanzo di racconti dentro una cornice', 'forma ibrida tra romanzo breve e racconto lungo', 'raccolta di racconti con un unico protagonista', 'raccolta di racconti', 'riscrittura', 'raccolta di saggi', 'romanzo fallito o opera non pubblicata', 'progetto incompiuto'])
	.range(['#0490ca', '#00b79e', '#f2d371', '#eb9d69', '#ed7f62', '#707e84', '#9d80bb', 'transparent', 'transparent'])

d3.json('data.json').then(function(json) {
	data = json;
	y.domain(data.map((d) => { return d.id }))

	let gArticles = g.append('g').attr('class', 'periodicals');

	let decade = g.selectAll('.decade')
		.data(data, function(d) { return d.id })
		.enter()
		.append('g')
		.attr('class', function(d) { return 'decade ' + d.id; })
		.attr('transform', function(d) { return 'translate(0,' + y(d.id) + ')' })

	let decadeLine = decade.selectAll('line')
		.data(function(d, i) { d.index = i;  transformPeriodicals(d); return [d]; })
		.enter()
		.append('line')
		.attr('class', 'guide-line')
		.attr('x1', 0)
		.attr('x2', width)
		.attr('y1', function(d, i) { return 0; })
		.attr('y2', function(d, i) { return 0; return y(d.id) })

	// let decadeLabel = decade.selectAll('.decade-label')
	// 	.data(function(d, i) { d.index = i; return [d]; })
	// 	.enter()
	// 	.append('text')
	// 	.attr('class', 'decade-label label')
	// 	.attr('x', 0)
	// 	.attr('y', function(d) { return 0; return y(d.id) })
	// 	.text(function(d) { return d.label })

	let decadeArc = decade.selectAll('.decade-arc')
		.data(function(d, i) { d.index = i; if(i == 0) { d.gradient = true; } return [d]; })
		.enter()
		.append('path')
		.attr('class', 'guide-line decade-arc')
		.style('stroke', function(d) {
			return d.gradient ? 'url(#gradient-1st-arc)' : '';
		})
		.attr('transform', function(d) { return 'translate(' + (d.index % 2 == 0 ? 0 : width) + ', ' + (-y.step() / 2) + ')' })
		.attr("d", function(d) {
			let myString = arc({
				outerRadius: y.step() / 2,
				endAngle: d.index % 2 == 0 ? -Math.PI : Math.PI
			}).split(/[A-Z]/);
			return "M" + myString[1] + "A" + myString[2]
		})

	let article = gArticles.selectAll('.article')
		.data(articles)
		.enter()
		.append('circle')
		.attr('class','article')
		.classed('ghost-node', function(d){ return d.ghostNode })
		.attr('r', 0)
		.attr('cx', function(d) { return d.x })
		.attr('cy', function(d) { return d.y })
		.style('opacity', 1e-6)

		article.transition()
			.duration(duration*3)
			.delay(function(d,i){ return i*3; })
			.attr('r', function(d){ return d.r })
			.style('opacity', .75)

	function ticked() {
		// console.log('tick')
		article
			.attr("cx", function(d) {
				if (d.x < 0) {
					return d.x = 0
				} else if (d.x > width) {
					return d.x = width
				}
				return d.x;
			})
			.attr("cy", function(d) { return d.y; });
	}

	let simulationArticle = d3.forceSimulation(articles)
		.force('collision', d3.forceCollide(function(d){ return d3.max([r2+2, d.r+2])}).iterations(2))
		.force('x', d3.forceX(function(d) { return d.x }).strength(0.1))
		.force('y', d3.forceY(function(d) { return d.y }).strength(0.6))
		.on("tick", ticked);


	let works = decade.selectAll('.work')
		.data(function(d, i) { return d.works; })
		.enter()
		.append('g')
		.attr('class', function(d) { return 'work ' + d.id })
		.attr('transform', function(d) {
			let position = d.year.toString().split('')[3];
			let _x = d.year.toString().split('')[2] % 2 == 0 ? x(position) : xInverse(position);
			let _y = d.distributeElement ? r * d.distributeElement * distributePadding : 0;
			return 'translate(' + _x + ',' + _y + ')';
		})

	works.append('circle')
		.attr('r', r)
		.style('fill', 'white')
		.style('stroke', function(d) { return col(d.kind) })

	works.append('text')
		.attr('class', 'label')
		.attr('y', -r)
		.text(function(d) { return d.label; })

	works.append('text')
		.attr('class', 'label year')
		.attr('y', r)
		.text(function(d) { return d.year; })

});

function transformPeriodicals(data) {
	console.log(data)
	data.periodicals.forEach((d) => {
		if (d.distributeElement) {
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
			let _x = d.year.toString().split('')[2] % 2 == 0 ? x(position) : xInverse(position);
			let node = {
				'x': _x,
				'y': y(data.id),
				'r': d3.max([r2 + d3.randomUniform(-3.5, 0)(), 1]),
				'decade': data.id,
				'decadeIndex': data.index
			}
			articles.push(node);
		}
	})

}
