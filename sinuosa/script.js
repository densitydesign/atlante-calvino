console.log('olè!')

// Draw visualisation

let data = [{
	id: 'anni40',
	label: 'Anni \'40',
	works: [{
			id: 'V001',
			label: 'Il sentiero dei nidi di ragno',
			year: 1947,
			kind: 'romanzo',
			firstPublication: null,
			publisher: ''
		},
		{
			id: 'V002',
			label: 'Ultimo viene il corvo',
			year: 1949,
			kind: 'raccolta di racconti',
			firstPublication: null,
			publisher: ''
		}
	],
	periodicals: [

	]
}, {
	id: 'anni50',
	label: 'Anni \'50',
	works: [{
			id: 'V003',
			label: 'Il visconte dimezzato',
			year: 1952,
			kind: 'forma ibrida tra romanzo breve e racconto lungo',
			firstPublication: null,
			publisher: ''
		},
		{
			id: 'V004',
			label: 'L\'entrata in guerra',
			year: 1954,
			kind: 'raccolta di racconti',
			firstPublication: null,
			publisher: ''
		},
		{
			id: 'V005',
			label: 'Le fiabe italiane',
			year: 1956,
			kind: 'riscrittura',
			firstPublication: null,
			publisher: ''
		},
		{
			id: 'V006',
			label: 'Il barone rampante',
			year: 1957,
			kind: 'romanzo',
			firstPublication: null,
			publisher: ''
		},
		{
			id: 'V007',
			label: 'I racconti',
			year: 1958,
			kind: 'raccolta di racconti',
			firstPublication: null,
			publisher: ''
		},
		{
			id: 'V008',
			label: 'Il cavaliere inesistente',
			year: 1959,
			kind: 'romanzo',
			firstPublication: null,
			publisher: ''
		}
	],
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

let x = d3.scalePoint()
	.domain([0,1,2,3,4,5,6,7,8,9])
	.range([0, width])
let xInverse = d3.scalePoint()
	.domain([9,8,7,6,5,4,3,2,1,0])
	.range([0, width])

let col = d3.scaleOrdinal()
	.domain(['romanzo','romanzo di racconti dentro una cornice','forma ibrida tra romanzo breve e racconto lungo','raccolta di racconti con un unico protagonista','raccolta di racconti','riscrittura','raccolta di saggi','romanzo fallito o opera non pubblicata','progetto incompiuto'])
	.range(['#0490ca','#00b79e','#f2d371','#eb9d69','#ed7f62','#707e84','#9d80bb','transparent','transparent'])

let decade = g.selectAll('.decade')
	.data(data, function(d) { return d.id })
	.enter()
	.append('g')
	.attr('class', function(d) { return 'decade ' + d.id; })
	.attr('transform', function(d) { return 'translate(0,' + y(d.id) + ')' })

let decadeLine = decade.selectAll('line')
	.data(function(d, i) { d.index = i; return [d]; })
	.enter()
	.append('line')
	.attr('class', 'guide-line')
	.attr('x1', 0)
	.attr('x2', width)
	.attr('y1', function(d, i) { return 0;  })
	.attr('y2', function(d, i) { return 0; return y(d.id) })

let decadeLabel = decade.selectAll('.decade-label')
	.data(function(d, i) { d.index = i; return [d]; })
	.enter()
	.append('text')
	.attr('class', 'decade-label label')
	.attr('x', 0)
	.attr('y', function(d) { return 0; return y(d.id) })
	.text(function(d) { return d.label })

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

let works = decade.selectAll('.work')
	.data(function(d, i) { return d.works; })
	.enter()
	.append('g')
	.attr('class', function(d) { return 'work ' + d.id })
	.attr('transform', function(d){
		let position = d.year.toString().split('')[3];
		return d.year.toString().split('')[2]%2==0 ? 'translate('+ x(position) +',0)' : 'translate('+ xInverse(position) +',0)'
	})

works.append('circle')
	.attr('r',m/6)
	.style('fill','white')
	.style('stroke', function(d){ return col(d.kind) })

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

	// reset
	if(thisDataAttribute == 'reset') {
		d3.selectAll('g.decade').transition().duration(duration)
			.attr('transform', function(d) { return 'translate(0,' + y(d.id) + ')' })
			.style('opacity', 1);

		d3.selectAll('.decade-arc').transition().duration(duration)
			// .attr('transform', function(d) { return 'translate(' + (d.index % 2 == 0 ? 0 : width) + ', ' + (y(d.id) - (y.step()) / 2) + ')' })
			.attr('transform', function(d) { return 'translate(' + (d.index % 2 == 0 ? 0 : width) + ', ' + (-y.step() / 2) + ')' })
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

	// align decades and arcs
	d3.selectAll('g.decade').each(function(d, i) {
		if(i < index) {
			// decade group
			d3.select(this).transition().duration(duration)
				.attr('transform', function(d) { return 'translate(0,' + (y(d.id) -m*.4) + ')' })
				// .attr('transform', 'translate(0,' + (-m * .4) + ')')

			// arcs
			d3.select(this).select('.decade-arc').transition().duration(duration)
				// .attr('transform', function(d) { return 'translate(' + (d.index % 2 == 0 ? 0 : width) + ', ' + (y(d.id) - (y.step()) / 2) + ')' })
				.attr('transform', function(d) { return 'translate(' + (d.index % 2 == 0 ? 0 : width) + ', ' + (-y.step() / 2) + ')' })
				.attr("d", function(d) {
					let myString = arc({
						outerRadius: (y.step()) / 2,
						endAngle: d.index % 2 == 0 ? -Math.PI : Math.PI
					}).split(/[A-Z]/);
					return "M" + myString[1] + "A" + myString[2]
				})

		} else if(i == index) {
			// decade group
			d3.select(this).transition().duration(duration)
				.attr('transform', function(d) { return 'translate(0,' + (y(d.id)) + ')' })

			// arcs
			d3.select(this).select('.decade-arc').transition().duration(duration)
				// .attr('transform', function(d) { return 'translate(' + (d.index % 2 == 0 ? 0 : width) + ', ' + (y(d.id) - (y.step() + m * .4) / 2) + ')' })
				.attr('transform', function(d) { return 'translate(' + (d.index % 2 == 0 ? 0 : width) + ', ' + (-(y.step() + m * .4) / 2) + ')' })
				.attr("d", function(d) {
					let myString = arc({
						outerRadius: (y.step() + m * .4) / 2,
						endAngle: d.index % 2 == 0 ? -Math.PI : Math.PI
					}).split(/[A-Z]/);
					return "M" + myString[1] + "A" + myString[2]
				})

		} else if(i > index) {
			// decade group
			d3.select(this).transition().duration(duration)
				.attr('transform', function(d) { return 'translate(0,' + (y(d.id) + m*.4) + ')' })

			// arcs
			if(i == index + 1) {
				d3.select(this).select('.decade-arc').transition().duration(duration)
					// .attr('transform', function(d) { return 'translate(' + (d.index % 2 == 0 ? 0 : width) + ', ' + (y(d.id) - (y.step() + m * .4) / 2) + ')' })
					.attr('transform', function(d) { return 'translate(' + (d.index % 2 == 0 ? 0 : width) + ', ' + (-(y.step()+m*.4) / 2) + ')' })
					.attr("d", function(d) {
						let myString = arc({
							outerRadius: (y.step() + m * .4) / 2,
							endAngle: d.index % 2 == 0 ? -Math.PI : Math.PI
						}).split(/[A-Z]/);
						return "M" + myString[1] + "A" + myString[2]
					})
			} else {
				d3.select(this).select('.decade-arc').transition().duration(duration)
					// .attr('transform', function(d) { return 'translate(' + (d.index % 2 == 0 ? 0 : width) + ', ' + (y(d.id) - (y.step()) / 2) + ')' })
					.attr('transform', function(d) { return 'translate(' + (d.index % 2 == 0 ? 0 : width) + ', ' + (-y.step() / 2) + ')' })
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
