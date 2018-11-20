console.log('olè!')

// Draw visualisation

let data = [{
	id: 'anni40',
	label: 'Anni \'40',
	works: [],
	periodicals: [

	]
}, {
	id: 'anni50',
	label: 'Anni \'50',
	works: [],
	periodicals: [

	]
}, {
	id: 'anni60',
	label: 'Anni \'60',
	works: [],
	periodicals: [

	]
}, {
	id: 'anni70',
	label: 'Anni \'70',
	works: [],
	periodicals: [

	]
}, {
	id: 'anni80',
	label: 'Anni \'80',
	works: [],
	periodicals: [

	]
}, {
	id: 'anni90',
	label: 'Anni \'90',
	works: [],
	periodicals: [

	]
}];
var duration = 500;
var arc = d3.arc().startAngle(0).innerRadius(0);
let container = d3.select('#visualisation-container');
let m = window.innerHeight / data.length;
let margin = {
	top: m / 2,
	right: m / 1.4,
	bottom: m / 2,
	left: m / 1.4
}
let width = container.node().clientWidth - margin.right - margin.left - 30;
let height = window.innerHeight - margin.top - margin.bottom;
let svg = d3.select('svg#visualisation')
	.attr('width', width + margin.right + margin.left)
	.attr('height', height + margin.top + margin.bottom);
let g = svg.append('g')
	.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

let y = d3.scalePoint()
	.domain(data.map((d) => { return d.id }))
	.range([0, height])

let decade = g.selectAll('.decade')
	.data(data, function(d) { return d.id })
	.enter()
	.append('g')
	.attr('class', function(d) { return 'decade ' + d.id; })

let decadeLine = decade.selectAll('line')
	.data(function(d, i) { d.index = i; return [d]; })
	.enter()
	.append('line')
	.attr('class', 'guide-line')
	.attr('x1', 0)
	.attr('x2', width)
	.attr('y1', function(d, i) { return y(d.id) })
	.attr('y2', function(d, i) { return y(d.id) })

let decadeLabel = decade.selectAll('.decade-label')
	.data(function(d, i) { d.index = i; return [d]; })
	.enter()
	.append('text')
	.attr('class', 'decade-label label')
	.attr('x', 0)
	.attr('y', function(d) { return y(d.id) })
	.text(function(d) { return d.label })

let decadeArc = decade.selectAll('.decade-arc')
	.data(function(d, i) { d.index = i; return [d]; })
	.enter()
	.append('path')
	.attr('class', 'guide-line decade-arc')
	.attr('transform', function(d) { return 'translate(' + (d.index % 2 == 0 ? 0 : width) + ', ' + (y(d.id) - y.step() / 2) + ')' })
	.attr("d", function(d) {
		let myString = arc({
			outerRadius: y.step() / 2,
			endAngle: d.index % 2 == 0 ? -Math.PI : Math.PI
		}).split(/[A-Z]/);
		return "M" + myString[1] + "A" + myString[2]
	})

// controlla scrollytelling
enterView({
	selector: '.item',
	enter: function(el) {
		scrollytelling(el)
	},
	exit: function(el) {
		scrollytelling(el)
	},
	offset: 0.6, // enter at middle of viewport
});

function scrollytelling(el) {
	let thisDataAttribute = d3.select(el).attr('data-attribute');
	if(thisDataAttribute == 'reset') {
		d3.selectAll('g.decade').transition().duration(duration)
			.attr('transform', 'translate(0,0)')
			.style('opacity', 1);

		d3.selectAll('.decade-arc').transition().duration(duration)
			.attr('transform', function(d) { return 'translate(' + (d.index % 2 == 0 ? 0 : width) + ', ' + (y(d.id) - (y.step()) / 2) + ')' })
			.attr("d", function(d) {
				let myString = arc({
					outerRadius: (y.step()) / 2,
					endAngle: d.index % 2 == 0 ? -Math.PI : Math.PI
				}).split(/[A-Z]/);
				return "M" + myString[1] + "A" + myString[2]
			})

		return;
	}
	let index = data.map(function(d) { return d.id }).indexOf(thisDataAttribute);
	console.log('enters/exits:', thisDataAttribute, index);
	// handle opacity
	d3.selectAll('g.decade')
		.style('opacity', .25);
	d3.selectAll('g.decade.' + thisDataAttribute)
		.style('opacity', 1);

	d3.selectAll('g.decade').each(function(d, i) {
		// console.log(d, i)
		if(i < index) {
			d3.select(this).transition().duration(duration)
				.attr('transform', 'translate(0,' + (-m*.4) + ')')
			d3.select(this).select('.decade-arc').transition().duration(duration)
				.attr('transform', function(d) { return 'translate(' + (d.index % 2 == 0 ? 0 : width) + ', ' + (y(d.id) - (y.step()) / 2) + ')' })
				.attr("d", function(d) {
					let myString = arc({
						outerRadius: (y.step()) / 2,
						endAngle: d.index % 2 == 0 ? -Math.PI : Math.PI
					}).split(/[A-Z]/);
					return "M" + myString[1] + "A" + myString[2]
				})
		} else if(i == index) {
			d3.select(this).transition().duration(duration)
				.attr('transform', 'translate(0,0)')
			d3.select(this).select('.decade-arc').transition().duration(duration)
				.attr('transform', function(d) { return 'translate(' + (d.index % 2 == 0 ? 0 : width) + ', ' + (y(d.id) - (y.step() + m*.4) / 2) + ')' })
				.attr("d", function(d) {
					let myString = arc({
						outerRadius: (y.step() + m*.4) / 2,
						endAngle: d.index % 2 == 0 ? -Math.PI : Math.PI
					}).split(/[A-Z]/);
					return "M" + myString[1] + "A" + myString[2]
				})
		} else if(i > index) {
			d3.select(this).transition().duration(duration)
				.attr('transform', 'translate(0,' + (+m*.4) + ')')

			if (i==index+1) {
				d3.select(this).select('.decade-arc').transition().duration(duration)
					.attr('transform', function(d) { return 'translate(' + (d.index % 2 == 0 ? 0 : width) + ', ' + (y(d.id) - (y.step() + m*.4) / 2) + ')' })
					.attr("d", function(d) {
						let myString = arc({
							outerRadius: (y.step() + m*.4) / 2,
							endAngle: d.index % 2 == 0 ? -Math.PI : Math.PI
						}).split(/[A-Z]/);
						return "M" + myString[1] + "A" + myString[2]
					})
			} else {
				d3.select(this).select('.decade-arc').transition().duration(duration)
					.attr('transform', function(d) { return 'translate(' + (d.index % 2 == 0 ? 0 : width) + ', ' + (y(d.id) - (y.step()) / 2) + ')' })
					.attr("d", function(d) {
						let myString = arc({
							outerRadius: (y.step()) / 2,
							endAngle: d.index % 2 == 0 ? -Math.PI : Math.PI
						}).split(/[A-Z]/);
						return "M" + myString[1] + "A" + myString[2]
					})
			}
		}
	})
}
