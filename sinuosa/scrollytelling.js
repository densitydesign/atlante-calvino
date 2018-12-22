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
			scrollytelling(el);
			d3.select('.legend').classed('open', true);
		},
		exit: function(el) {
			scrollytelling(el);
			d3.select('.legend').classed('open', true);
		},
		offset: 1, // enter at middle of viewport
	});
}

function scrollytelling(el) {
	let thisDataAttribute = d3.select(el).attr('data-attribute');

	d3.selectAll('.item').style('opacity', .35)
	d3.select(el).style('opacity', 1)

	if (thisDataAttribute == 'anni40') {
		g.transition().duration(duration).attr('transform', 'translate(' + margin.left + ',' + (margin.top + 80) + ')')
	} else if (thisDataAttribute == 'anni90') {
		g.transition().duration(duration).attr('transform', 'translate(' + margin.left + ',' + (margin.top - 40) + ')')
	} else {
		g.transition().duration(duration).attr('transform', 'translate(' + margin.left + ',' + (margin.top + 40) + ')')
	}

	if (d3.select(el).attr('class') != 'item-reset-top' && d3.select(el).attr('class') != 'item-reset-bottom') {
		d3.select('.legend').classed('open', false);
	} else {
		d3.select('.legend').classed('open', true);
	}

	if(thisDataAttribute == 'reset') {

		d3.selectAll('g.decade')
			.classed('in-focus', false)
			.transition().duration(duration)
			.attr('transform', function(d) { return 'translate(0,' + y(d.id) + ')' })
			.style('opacity', 1);

		d3.selectAll('.article').transition().duration(duration)
			.attr('transform', function(d) { return 'translate(0, 0)' })
			.style('opacity', 1);

		d3.selectAll('.decade-arc.start')
			.attr("d", function(d) {
				return decadeArcs(d, 'start', false);
			})
		d3.selectAll('.decade-arc.end').transition().duration(duration)
			.attr("d", function(d) {
				return decadeArcs(d, 'end', false);
			})

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
			d3.select(this).classed('in-focus', false)
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
			d3.select(this).classed('in-focus', true)
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
			d3.select(this).classed('in-focus', false)
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
				.style('opacity', 1);
		} else if(d.decadeIndex > index) {
			d3.select(this).transition().duration(duration)
				.attr('transform', function(d) { return 'translate(0,' + (space) + ')' })
				.style('opacity', .25);
		}
	})
}
