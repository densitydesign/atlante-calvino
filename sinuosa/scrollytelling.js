// "space" is the space given when scrollin on a section, defined in previous Javascript

function activateStorytelling() { // controlla scrollytelling
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

	// controlla scrollytelling
	enterView({
		selector: '.item-focus',
		enter: function(el) {
			let sel = d3.select(el).attr('data-attribute').split('-');
			d3.select('.' + sel[0]).selectAll('.work').style('opacity', .5)
			sel[1].split('|').forEach((d) => {
				d3.select('.' + sel[0]).selectAll('.' + d).style('opacity', 1)
			})

		},
		exit: function(el) {
			let sel = d3.select(el).attr('data-attribute').split('-');
			d3.select('.' + sel[0]).selectAll('.work').style('opacity', 1)
		},
		offset: 0.5, // enter at middle of viewport
	});
}

function scrollytelling(el) {
	let thisDataAttribute = d3.select(el).attr('data-attribute');

	console.log('enters/exits:', thisDataAttribute);

	// reset
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
