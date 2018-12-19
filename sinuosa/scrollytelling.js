// "space" is the space given when scrollin on a section, defined in previous Javascript

function activateStorytelling() { // controlla scrollytelling
	enterView({
		selector: '.item',
		enter: function(el) {
			scrollytelling(el);
		},
		exit: function(el) {
			scrollytelling(el);
		},
		offset: 0.8, // enter at middle of viewport
	});

	enterView({
		selector: '.item-reset-bottom',
		enter: function(el) {
			scrollytelling(el);
			d3.select('.legend').classed('open', true);
		},
		exit: function(el) {
			scrollytelling(el);
			d3.select('.legend').classed('open', false);
		},
		offset: 0, // enter at middle of viewport
	});

	enterView({
		selector: '.item-reset-top',
		enter: function(el) {
			// console.log('enter uouououou')
			scrollytelling(el);
			d3.select('.legend').classed('open', true);
		},
		exit: function(el) {
			// console.log('exit uouououou')
			scrollytelling(el);
			d3.select('.legend').classed('open', true);
		},
		offset: 1, // enter at middle of viewport
	});

	// controlla scrollytelling
	// enterView({
	// 	selector: '.item-focus',
	// 	enter: function(el) {
	// 		let sel = d3.select(el).attr('data-attribute').split('-');
	// 		d3.select('.' + sel[0]).selectAll('.work').style('opacity', .5)
	// 		sel[1].split('|').forEach((d) => {
	// 			d3.select('.' + sel[0]).selectAll('.' + d).style('opacity', 1)
	// 		})
	//
	// 	},
	// 	exit: function(el) {
	// 		let sel = d3.select(el).attr('data-attribute').split('-');
	// 		d3.select('.' + sel[0]).selectAll('.work').style('opacity', 1)
	// 	},
	// 	offset: 0.5, // enter at middle of viewport
	// });
}

function scrollytelling(el) {
	let thisDataAttribute = d3.select(el).attr('data-attribute');

	d3.selectAll('.item').style('opacity', .35)
	d3.select(el).style('opacity', 1)

	console.log('enters/exits:', thisDataAttribute);

	// reset

	console.log('reset uouououo')
	if(thisDataAttribute == 'reset') {
		d3.selectAll('g.decade').transition().duration(duration)
			.attr('transform', function(d) { return 'translate(0,' + y(d.id) + ')' })
			.style('opacity', 1);

		d3.selectAll('.article').transition().duration(duration)
			.attr('transform', function(d) { return 'translate(0, 0)' })
			.style('opacity', .75);

		d3.selectAll('.decade-arc.start')
			.attr("d", function(d) {
				return decadeArcs(d, 'start', false);
			})
		d3.selectAll('.decade-arc.end').transition().duration(duration)
			.attr("d", function(d) {
				return decadeArcs(d, 'end', false);
			})
		console.log(d3.select(el).attr('class'))
		if (d3.select(el).attr('class') != 'item-reset-top' && d3.select(el).attr('class') != 'item-reset-bottom') {
			d3.select('.legend').classed('open', false);
		}

		return;
	}

	let index = data.map(function(d) { return d.id }).indexOf(thisDataAttribute);
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
				.attr('transform', function(d) { return 'translate(0,' + (y(d.id) - space) + ')' })
			// previous publications
			d3.select(this).selectAll('.previous-publication').transition().duration(duration)
				.attr('d', function(d) {
					return previousPublicationsLine(d);
				})
			d3.select(this).selectAll('.previous-publication-circle').transition().duration(duration)
				.attr('cy', function(d){
					let arrrr = previousPublicationsLine(d).split(' ');
					arrrr = arrrr[arrrr.length-1].split(',');
					return arrrr[1] - firstPubRadius*2 - 5
				})
			d3.select(this).select('.decade-arc.start').transition().duration(duration)
				.attr("d", function(d) {
					return decadeArcs(d, 'start', false);
				})
			d3.select(this).select('.decade-arc.end').transition().duration(duration)
				.attr("d", function(d) {
					return decadeArcs(d, 'end', false);
			})

		} else if(i == index) {
			// decade group
			d3.select(this).transition().duration(duration)
				.attr('transform', function(d) { return 'translate(0,' + (y(d.id)) + ')' })
			// previous publications
			d3.select(this).selectAll('.previous-publication').transition().duration(duration)
				.attr('d', function(d) {
					return previousPublicationsLine(d, true);
				})
			d3.select(this).selectAll('.previous-publication-circle').transition().duration(duration)
				.attr('cy', function(d){
					let arrrr = previousPublicationsLine(d, true).split(' ');
					arrrr = arrrr[arrrr.length-1].split(',');
					return arrrr[1] - firstPubRadius*2 - 5
				})
			d3.select(this).select('.decade-arc.start').transition().duration(duration)
				.attr("d", function(d) {
					return decadeArcs(d, 'start', true);
				})
			d3.select(this).select('.decade-arc.end').transition().duration(duration)
				.attr("d", function(d) {
					return decadeArcs(d, 'end', true);
				})

		} else if(i > index) {
			// decade group
			d3.select(this).transition().duration(duration)
				.attr('transform', function(d) { return 'translate(0,' + (y(d.id) + space) + ')' })
			// previous publications
			d3.select(this).selectAll('.previous-publication').transition().duration(duration)
				.attr('d', function(d) {
					return previousPublicationsLine(d);
				})
			d3.select(this).selectAll('.previous-publication-circle').transition().duration(duration)
				.attr('cy', function(d){
					let arrrr = previousPublicationsLine(d).split(' ');
					arrrr = arrrr[arrrr.length-1].split(',');
					return arrrr[1] - firstPubRadius*2 - 5
				})
			d3.select(this).select('.decade-arc.start').transition().duration(duration)
				.attr("d", function(d) {
					return decadeArcs(d, 'start', false);
				})
			d3.select(this).select('.decade-arc.end').transition().duration(duration)
				.attr("d", function(d) {
					return decadeArcs(d, 'end', false);
				})

			// arcs
			if(i == index + 1) {
				// previous publications
				d3.select(this).selectAll('.previous-publication').transition().duration(duration)
					.attr('d', function(d) {
						return previousPublicationsLine(d, true);
					})
				d3.select(this).selectAll('.previous-publication-circle').transition().duration(duration)
					.attr('cy', function(d){
						let arrrr = previousPublicationsLine(d, true).split(' ');
						arrrr = arrrr[arrrr.length-1].split(',');
						return arrrr[1] - firstPubRadius*2 - 5
					})
			} else {
				// do stuff
			}
		}
	})

	// articles on periodicals
	d3.selectAll('.article').each(function(d, i) {
		if(d.decadeIndex < index) {
			d3.select(this).transition().duration(duration)
				.attr('transform', function(d) { return 'translate(0,' + (-space) + ')' })
				.style('opacity', .25);
		} else if(d.decadeIndex == index) {
			d3.select(this).transition().duration(duration)
				.attr('transform', function(d) { return 'translate(0, 0)' })
				.style('opacity', .75);
		} else if(d.decadeIndex > index) {
			d3.select(this).transition().duration(duration)
				.attr('transform', function(d) { return 'translate(0,' + (space) + ')' })
				.style('opacity', .25);
		}
	})
}

d3.select('#legend-button').on('click', function(d){
	console.log('legend open/closed')
	d3.select('.legend').classed('open', d3.select('.legend').classed('open') ? false : true)
})

d3.selectAll('span.work-title')
	.on('mouseover touchstart', function(){
		let id = d3.select(this).attr('data-attribute')
		console.log(id)
		d3.select('.work.'+id+' circle').classed('in-focus', true);
	})
	.on('mouseout touchend', function(){
		let id = d3.select(this).attr('data-attribute')
		console.log(id)
		d3.select('.work.'+id+' circle').classed('in-focus', false);
	})
