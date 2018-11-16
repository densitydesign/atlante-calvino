console.log('olè!')

// Draw visualisation

let container = d3.select('#visualisation-container');
let m = window.innerHeight / 6;
let margin = {
	top: m/2,
	right: m/1.4,
	bottom: m,
	left: m/1.4
}
let width = container.node()
	.clientWidth - margin.right - margin.left - 30;
let height = window.innerHeight - margin.top - margin.bottom;
let svg = d3.select('svg#visualisation')
	.attr('width', width + margin.right + margin.left)
	.attr('height', height + margin.top + margin.bottom);
let g = svg.append('g')
	.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')



let decadesData = [
{
  id: 'anni40',
  title: 'Anni \'40',
	works: [],
	periodicals: [

	]
}, {
  id: 'anni50',
	title: 'Anni \'50',
	works: [],
	periodicals: [

	]
}, {
  id: 'anni60',
	title: 'Anni \'60',
	works: [],
	periodicals: [

	]
}, {
  id: 'anni70',
	title: 'Anni \'70',
	works: [],
	periodicals: [

	]
}, {
  id: 'anni80',
	title: 'Anni \'80',
	works: [],
	periodicals: [

	]
}];

let decade = g.selectAll('.decade')
	.append('line')
	.data(decadesData, function(d){return d.id})
	.enter()
	.append('line')
	.attr('class', function(d){
    return 'guide-line decade '+d.id;
  })
	.attr('x1', 0)
	.attr('y1', function(d,i){
    return i*m
  })
	.attr('x2', width)
	.attr('y2', function(d,i){
    return i*m
  })

// Arcs
var arcR = d3.arc()
	.startAngle(0)
	.endAngle(Math.PI)
	.innerRadius(0);
var arcL = d3.arc()
	.startAngle(0)
	.endAngle(-Math.PI)
	.innerRadius(0);

svg.append("path")
	.attr('class', 'guide-line')
	.attr('transform', 'translate(' + (m / 2) + ', ' + (0) + ')')
	.attr("d", function() {
		let myString = arcL({
				outerRadius: m / 2
			})
			.split(/[A-Z]/);
		return "M" + myString[1] + "A" + myString[2]
	})

// controlla scrollytelling
enterView({
	selector: '.item',
	enter: function(el) {
		let thisDataAttribute = d3.select(el)
			.attr('data-attribute');
    // console.log('enters:',thisDataAttribute);
    // opacity
    d3.selectAll('.guide-line, .item').style('opacity',.35);
    d3.selectAll('.'+thisDataAttribute).style('opacity',1);
	},
  exit: function(el) {
    let thisDataAttribute = d3.select(el)
			.attr('data-attribute');
    // console.log('exits:',thisDataAttribute);
    // opacity
    d3.selectAll('.guide-line, .item').style('opacity',.35);
    d3.selectAll('.'+thisDataAttribute).style('opacity',1);
  },
	offset: 0.5, // enter at middle of viewport
});
