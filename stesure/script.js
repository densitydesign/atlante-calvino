console.info('stesure.js')

window.addEventListener('DOMContentLoaded', init)

function init() {
  Tabletop.init({
    key: 'https://docs.google.com/spreadsheets/d/1UPiuY_6vEu-bXPEcZTf8BAVuQIzDsIIfsvoDhwN18Iw/edit?usp=sharing',
    callback: formatData,
    simpleSheet: false
  })
}

function formatData(data) {
  // console.log('data is loaded')
  // console.log(data)

  data.stesure.elements.forEach(function(d) {
    // start
    d.precision_start = 'none';
    if (d.start_year) {
      d.precision_start = 'year';
      if (d.start_month) {
        d.precision_start = 'month';
        if (d.start_month.length < 2) {
          d.start_month = '0' + d.start_month
        }
        if (d.start_day) {
          d.precision_start = 'day';
          if (d.start_day.length < 2) {
            d.start_day = '0' + d.start_day
          }
          var dateString = d.start_year + '-' + d.start_month + '-' + d.start_day;
          d.start = parseDate(dateString);
        } else {
          var dateString = d.start_year + '-' + d.start_month + '-01';
          d.start = parseDate(dateString);
        }
      } else {
        var dateString = d.start_year + '-01-01';
        d.start = parseDate(dateString);
      }
    } else {
      d.start = undefined;
    }

    // end
    d.precision_end = 'none';
    if (d.end_year) {
      d.precision_end = 'year';
      if (d.end_month) {
        d.precision_end = 'month';
        if (d.end_month.length < 2) {
          d.end_month = '0' + d.end_month
        }
        if (d.end_day) {
          d.precision_end = 'day';
          if (d.end_day.length < 2) {
            d.end_day = '0' + d.end_day
          }
          var dateString = d.end_year + '-' + d.end_month + '-' + d.end_day;
          d.end = parseDate(dateString);
        } else {

          //Do this for calculating last day of the month
          let day = '28';
          if (parseInt(d.end_month) < 12) {
            let thisDate = new Date(d.end_year, parseInt(d.end_month), 0)
            day = thisDate.getDate()
          } else {
            day = '31';
          }

          var dateString = d.end_year + '-' + d.end_month + '-' + day;
          d.end = parseDate(dateString);
          // console.log(d.end)
        }
      } else {
        var dateString = d.end_year + '-12-28';
        d.end = parseDate(dateString);
      }
    } else {
      d.end = undefined;
    }

    // clean useless data
    delete d.intervallo_stesura;
    delete d.originale;

  })

  data.pubblicazioni.elements.forEach(function(d) {

    d.precision_publication = 'none';
    d.publication = undefined;
    if (d.year) {
      d.precision_publication = 'year';
      if (d.month) {
        d.precision_publication = 'month';
        if (d.day) {
          d.precision_publication = 'day';
          var dateString = d.year + '-' + d.month + '-' + d.day;
          d.publication = parseDate(dateString);
        } else {

          //Do this for calculating last day of the month
          let day = '28';
          if (parseInt(d.month) < 12) {
            let thisDate = new Date(d.year, parseInt(d.month), 0)
            day = thisDate.getDate()
          } else {
            day = '31';
          }

          var dateString = d.year + '-' + d.month + '-' + day;
          d.publication = parseDate(dateString);
        }
      } else {
        var dateString = d.year + '-12-31';
        d.publication = parseDate(dateString);
      }
    }


  })



  gantt(data)
}

function convertData(json) {

  // console.info('convert data')

  var writings = json.stesure.elements
  var info = json.info.elements
  var publications = json.pubblicazioni.elements
  var groups = json.gruppi.elements.filter(d => {
    return !d.skip
  })

  let data_example = {
    "id": "racconto-Alba sui rami nudi",
    "titolo": "Alba sui rami nudi",
    "conteggio": "1",
    "start_year": "1947",
    "start_month": "12",
    "start_day": "",
    "end_year": "1947",
    "end_month": "12",
    "end_day": "",
    "precision_start": "month",
    "start": "1947-11-30T23:00:00.000Z",
    "precision_end": "month",
    "end": "1947-12-30T23:00:00.000Z"
  }

  groups = d3.nest()
    .key(d => {
      return d.gruppo
    })
    .rollup(v => {
      v = v.map(d => {
        d = writings.filter(e => {
          return e.id == d.id
        })[0]
        return d
      })
      return v
    })
    .entries(groups)

  groups.forEach(d => {
    d.start = d3.min(d.value.map(e => {
      return e.start ? e.start : null
    }))
    d.end = d3.max(d.value, function(e) {
      return e.end ? e.end : null
    })
  })

  // Sort groups by first publication date
  groups = groups.sort(function(a, b) {
    let first_a = publications.filter(function(e) {
      return e.id == a.key
    }).sort(function(a, b) {
      return a.publication - b.publication
    })
    let first_b = publications.filter(function(e) {
      return e.id == b.key
    }).sort(function(a, b) {
      return a.publication - b.publication
    })
    return first_a[0].publication - first_b[0].publication
  })

  // sort stories by first publication date
  groups.forEach(function(g) {
    g.value.sort(function(a, b) {
      let first_a = publications.filter(function(e) {
        return e.id == a.id
      }).sort(function(a, b) {
        return a.publication - b.publication
      })
      let first_b = publications.filter(function(e) {
        return e.id == b.id
      }).sort(function(a, b) {
        return a.publication - b.publication
      })
      if (first_a.length && first_b.length) {
        return first_a[0].publication - first_b[0].publication
      }
    })
  })

  // See if stories have been published on previous collections
  groups.forEach(function(g, i) {
    g.appearPreviously = []
    for (var j = 0; j < i; j++) {
      g.value.forEach(function(s) {
        let filtered = groups[j].value.filter(function(d) {
          return d.id == s.id
        })
        if (filtered.length) {
          g.appearPreviously.push(s.id);
        }
      })
    }
  })

  data = {
    'writings': writings,
    'info': info,
    'publications': publications,
    'groups': groups
  }

  return data
}

let parseDate = d3.timeParse("%Y-%m-%d")
let boundaries = [parseDate('1940-01-01'), parseDate('1990-12-31')]
let data
let itemHeight = 50
let subHeight = 40

var symbolFirstPublication = {
  draw: function(context, size) {

    context.moveTo(-size * 0.5, -size * 0.5)
    context.lineTo(size * 0.5, -size * 0.5)
    context.lineTo(0, size * 0.6)
    context.closePath();


  }
}

var diamond = {
  draw: function(context, size) {
    context.moveTo(0, -size / 2)
    context.lineTo(size / 3, 0)
    context.lineTo(0, size / 2)
    context.lineTo(-size / 3, 0)
    context.lineTo(0, -size / 2)
    context.closePath();
  }
}

function gantt(data) {

  // Convert the data into a usable format
  let converted = convertData(data);
  var writings = converted.writings
  var info = converted.info
  var publications = converted.publications
  var groups = converted.groups

  // Set dimentions
  var elem = document.getElementById("gantt");
  var groupBoxStyle = window.getComputedStyle(elem, null);
  let width = parseInt(groupBoxStyle.width)
  width -= parseInt(groupBoxStyle.paddingLeft)
  width -= parseInt(groupBoxStyle.paddingRight)
  width -= 15

  let margin = {
    top: 20,
    right: 5,
    bottom: 0,
    left: 0
  }


    let height = itemHeight * groups.length + margin.top;
    let newHeight = height;

  // define vertical scale
  let y = d3.scaleBand()
    .domain(groups.map(d => {
      return d.key
    }))
    .range([margin.top, height])
    .padding(0)

  // scale of gantt, to be updated on brush
  let x = d3.scaleTime()
    .domain(boundaries)

  let xAxis = d3.axisBottom(x)
    // .ticks(d3.timeYear.every(5))
    .tickPadding(30)

  // Scale for the brush
  let xBrush = d3.scaleTime()
    .domain(boundaries)

  let brushAxis = d3.axisBottom(xBrush)
    .ticks(d3.timeYear.every(3))
    .tickPadding(7)

  // define element for the brush
  let brushSVG = d3.select('#brush > svg')
    .attr('height', 50)
    .attr('width', width)

  // define elements for the gantt chart
  let ganttSVG = d3.select('#gantt > svg')
    .attr('width', width)
    .attr('height', height)

  // define elements for the timeline at the bottom
  let timelineSVG = d3.select('#timeline > svg')
    .attr('height', 70)
    .attr('width', width)

  let pannable = ganttSVG.append("rect")
    .attr('class', 'pannable')

  let gantt = ganttSVG.append('g').classed('gantt', true)

  let volumes = gantt.append('g').classed('volumes-group', true).attr('clip-path', 'url(#clip)')
  let volume = volumes.selectAll('.volume')

  let tooltipGroup = volumes.append('g').classed('tooltip-group', true)

  // rest of Gantt
  let baseline = volume.selectAll('.baseline')
  let previousWriting = volume.selectAll('.previous-writing')
  let uncertain = volume.selectAll('.uncertain')
  let certain = volume.selectAll('.certain')

  let story = volumes.selectAll('.story')
  let storyBaseline = story.selectAll('.baseline')
  let storySpan = story.selectAll('.span')
  let storyStart = story.selectAll('.start')
  let storyEnd = story.selectAll('.end')
  let storyPublication = story.selectAll('.baseline')

  let volumePublication = volume.selectAll('.volume-publication')

  let labels = gantt.append('g').classed('labels-group', true)
  let label = labels.selectAll('.label')
  let triangle = labels.selectAll('.triangle')

  let storyLabel = labels.selectAll('.story-label')

  // for tooltip
  let selectedDateLine = tooltipGroup.selectAll('.selected-date-line')
  selectedDateLine = selectedDateLine.data([])
  let selectedMag = tooltipGroup.selectAll('.selected-mag')
  selectedMag = selectedMag.data([])

  let selectedDate = timelineSVG.selectAll('.date-tooltip')
  selectedDate = selectedDate.data([])

  function update() {

    // labels first
    label = label.data(groups, d => {
      return d.key
    })
    label.exit().remove()
    label = label.enter().append('g')
      .classed('label', true)
      .classed('composite', d => {
        return d.value.length > 1
      })
      .merge(label)

    label.attr('transform', d => {
      return `translate(0,${y(d.key)})`;
    })

    let title = label.selectAll('.title').data(function(d) {
      return [d]
    }, function(d) {
      return d.key
    })
    title.exit().remove()
    title = title.enter().append('text')
      .classed('title', true)
      .attr('y', 28)
      .text(d => {
        let title = info.filter(e => {
          return e.id == d.key
        })[0].titolo
        return title
      })
      .merge(title)

    // calculate left margin
    title
      .each(function(d, i) {
        let thisWidth = d3.select(this).node().getBBox().width + 60
        margin.left = d3.max([(margin.left), thisWidth])
      })
      .attr('x', margin.left - 60)

    // Update width
    width -= margin.left
    width -= margin.right

    volumes.attr(`transform`, `translate(${margin.left},0)`)
    d3.select('.gantt-info').style('width', (margin.left - 60) + 'px')
    d3.select('#brush > .brush-info').style('padding-left', (margin.left + 0) + 'px')

    // After margin is set, draw the temporal axis at the bottom, in a different SVG so to make it sticky via CSS
    x.range([0, width])

    timelineSVG.append("g")
      .attr("class", "axis axis--x")
      .attr(`transform`, `translate(${margin.left},1)`)
      .call(xAxis);

    triangle = label.selectAll('.triangle').data(function(d) {
      return d.value.length > 1 ? [d] : []
    }, function(d) {
      return d.key
    })
    triangle.exit().remove()
    triangle = triangle.enter().append('path')
      .classed('triangle', true)
      .attr('d', d3.symbol().size(120).type(d3['symbolTriangle'])())
      .attr('transform', `translate(${margin.left-30}, 25) rotate(90)`)
      .on('click', function(d) {

        d3.select(this).classed("expanded", !d3.select(this).classed("expanded"))

        if (d3.select(this).classed("expanded")) {
          draw(d)
        } else {
          draw({
            value: []
          })
        }
      })
      .merge(triangle)

    // now volumes
    volume = volume.data(groups, d => {
      return d.key
    })
    volume.exit().remove()
    volume = volume.enter().append('g')
      .classed('volume', true)
      .classed('composite', d => {
        return d.value.length > 1
      })
      .merge(volume)

    volume.attr('transform', d => {
      return `translate(0,${y(d.key)})`;
    })

    baseline = volume.selectAll('.baseline').data(function(d) {
      return [d]
    })
    baseline.exit().remove()
    baseline = baseline.enter().append('line')
      .classed('baseline', true)
      .merge(baseline)

    previousWriting = volume.selectAll('.previous-writing').data(function(d) {
      let items = d.value.filter(e => {
        return d.appearPreviously.indexOf(e.id) > -1
      })
      if (items.length) {

        let start = d3.min(items, e => {
          return e.start
        })
        let end = d3.max(items, e => {
          return e.end
        })
        let datum = {
          start: start,
          end: end,
          key: d.key
        }

        // On the uncertain writing timespan if the ending date take place later than the first publication, use the date of the first publication as the ending date of the writing timespan
        let thisPublications = publications.filter(e => {
          return e.id == d.key
        })
        thisPublications = thisPublications.sort(function(a, b) {
          return a.publication - b.publication
        })
        if (thisPublications.length) {
          if (thisPublications[0].precision_publication == 'day') {
            if (datum.end > thisPublications[0].publication) {
              datum.end = thisPublications[0].publication
            }
          }
        }
        // return values only if dates are defined (there could be only values with undefined dates)
        if (datum.start && datum.end) {
          return [datum]
        } else {
          return []
        }
      } else {
        return []
      }
    })

    previousWriting.exit().remove()

    previousWriting = previousWriting.enter().append('rect')
      .classed('previous-writing', true)
      .merge(previousWriting)

    uncertain = volume.selectAll('.uncertain').data(function(d) {
      let items = d.value.filter(e => {
        return e.precision_start != 'day' && e.precision_end != 'day' && d.appearPreviously.indexOf(e.id) < 0
      })

      if (items.length) {

        let start = d3.min(items, e => {
          return e.start
        })
        let end = d3.max(items, e => {
          return e.end
        })
        let datum = {
          start: start,
          end: end,
          key: d.key
        }

        // On the uncertain writing timespan if the ending date take place later than the first publication, use the date of the first publication as the ending date of the writing timespan
        let thisPublications = publications.filter(e => {
          return e.id == d.key
        })
        thisPublications = thisPublications.sort(function(a, b) {
          return a.publication - b.publication
        })
        if (thisPublications.length) {
          if (thisPublications[0].precision_publication == 'day') {
            if (datum.end > thisPublications[0].publication) {
              datum.end = thisPublications[0].publication
            }
          }
        }
        // return values only if dates are defined (there could be only values with undefined dates)
        if (datum.start && datum.end) {
          return [datum]
        } else {
          return []
        }
      } else {
        return []
      }


    })
    uncertain.exit().remove()
    uncertain = uncertain.enter().append('rect')
      .classed('uncertain', true)
      .merge(uncertain)

    certain = volume.selectAll('.certain').data(function(d) {
      let items = d.value.filter(e => {
        return e.precision_start == 'day' && e.precision_end == 'day' && d.appearPreviously.indexOf(e.id) < 0
      })
      if (items.length) {
        let start = d3.min(items, e => {
          return e.start
        })
        let end = d3.max(items, e => {
          return e.end
        })
        let datum = {
          start: start,
          end: end,
          items: items
        }
        if (datum.start && datum.end) {
          return [datum]
        } else {
          return []
        }
      } else {
        return []
      }
    })
    certain.exit().remove()
    certain = certain.enter().append('rect')
      .classed('certain', true)
      .merge(certain)

    volumePublication = volume.selectAll('.volume-publication').data(function(d) {
      let datum = publications.filter(e => {
        return e.id == d.key
      })
      datum = datum.sort(function(a, b) {
        return a.publication - b.publication
      })
      return datum.splice(0, 1)
    })
    volumePublication.exit().remove()
    volumePublication = volumePublication.enter().append('path')
      .classed('publication', true)
      // .classed('not-precise', function(d) {
      //   return d.precision_publication != 'day'
      // })
      .attr('d', d3.symbol().type(symbolFirstPublication).size(12))
      .merge(volumePublication)
      .on('click', function(d) {
        showDate(d, d3.event);
      })

    story = volume.selectAll('.story').data([])
    story.exit().remove()
    story = story.enter().append('g')
      .classed('.story', true)
      .merge(story)

    // define brush and pan

    var zoom = d3.zoom()
      .scaleExtent([1, Infinity])
      .translateExtent([
        [0, 0],
        [width, height]
      ])
      .extent([
        [0, 0],
        [width, height]
      ])
      .on("zoom", zoomed)


    pannable.attr('x', x(x.domain()[0]))
      .attr('y', 0)
      .attr('height', height)
      .attr('width', x(x.domain()[1]) - x(x.domain()[0]))
      .attr("transform", "translate(" + margin.left + "," + 0 + ")")
      .call(zoom)
      .on("wheel.zoom", null)
      .on('click', showDate)

    xBrush.range([0, width])

    brushSVG
      .append("g")
      // .attr(`transform`, `translate(${margin.left},0)`)
      .append("g")
      .attr("class", "axis axis--x")
      .attr(`transform`, `translate(0,15)`)
      .call(brushAxis);

    var brush = d3.brushX()
      .extent([
        [0, 0],
        [width, 15]
      ])
      .handleSize(48)
      .on("brush end", brushed);

    let brush_g = brushSVG.select('g').attr("transform", "translate(" + margin.left + "," + 0 + ")")
      .append('g')


    brush_g.append("g")
      .attr("class", "brush")
      .call(brush)
      .call(brush.move, xBrush.range())
    // .call(brush.move, [x(parseDate('1944-12-01')), x(parseDate('1955-01-01'))]);

    ganttSVG.append("defs").append("clipPath")
      .attr("id", "clip")
      .append("rect")
      .attr('x', x(x.domain()[0]))
      .attr('y', 0)
      .attr('height', height)
      .attr('width', x(x.domain()[1]) - x(x.domain()[0]))

    function brushed() {
      if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
      var s = d3.event.selection || xBrush.range();
      x.domain(s.map(xBrush.invert, xBrush));
      pannable.call(zoom.transform, d3.zoomIdentity
        .scale((width) / (s[1] - s[0]))
        .translate(-s[0], 0));
      timelineSVG.select(".axis--x").call(xAxis);
      draw()
    }

    function zoomed() {
      if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
      var t = d3.event.transform;
      x.domain(t.rescaleX(xBrush).domain());
      brushSVG.select(".brush").call(brush.move, x.range().map(t.invertX, t));
      timelineSVG.select(".axis--x").call(xAxis);
      draw()
    }

  } // update

  update()

  function draw(selectedVolume) {

    baseline.attr('x1', x(x.domain()[0]))
      .attr('y1', 25)
      .attr('x2', x(x.domain()[1]))
      .attr('y2', 25)

    previousWriting.attr('y', 19)
      .attr('height', 12)
      .attr('x', d => {
        return x(d.start)
      })
      .attr('width', d => {
        return x(d.end) - x(d.start)
      })

    uncertain.attr('y', 19)
      .attr('height', 12)
      .attr('x', d => {
        return x(d.start)
      })
      .attr('width', d => {
        return x(d.end) - x(d.start)
      })

    certain.attr('y', 19)
      .attr('height', 12)
      .attr('x', d => {
        return x(d.start)
      })
      .attr('width', d => {
        return x(d.end) - x(d.start)
      })

    volumePublication
      .attr('transform', function(d) {
        return `translate(${x(d.publication)}, 10)`
      })

    let duration = 500;

    if (selectedVolume) {

      triangle.classed('expanded', d => {
          return d.key == selectedVolume.key
        })
        .transition().duration(duration)
        .attr('transform', d => {
          return (selectedVolume ? d.key == selectedVolume.key : false) ? `translate(${margin.left-30}, 25) rotate(180)` : `translate(${margin.left - 30 },25) rotate(90)`
        })

      let selectedIndex = groups.indexOf(selectedVolume)
      // console.log('volume:', selectedIndex, selectedVolume)

      volume.each(function(d, i) {
        // console.log(d, i)
        if (i <= selectedIndex) {
          d3.select(this).transition().duration(duration).attr('transform', e => {
            return `translate(0,${y(e.key)})`;
          })
          if (i == selectedIndex) {

          }
        } else {
          d3.select(this).transition().duration(duration).attr('transform', e => {
            return `translate(0,${y(e.key) + selectedVolume.value.length*subHeight})`;
          })
        }
      })

      label.each(function(d, i) {
        // console.log(d, i)
        if (i <= selectedIndex) {
          d3.select(this).transition().duration(duration).attr('transform', e => {
            return `translate(0,${y(e.key)})`;
          })
        } else {
          d3.select(this).transition().duration(duration).attr('transform', e => {
            return `translate(0,${y(e.key) + selectedVolume.value.length*subHeight})`;
          })
        }
      })

      // console.log('Draw stories')
      // set stories
      story = volumes.selectAll('.story').data(selectedVolume.value, d => {
        return d.id
      })
      story.exit().transition().duration(duration).style('opacity', 1e-16).remove()
      story = story.enter().append('g')
        .classed('story', true)
        .classed('precise', d => {
          return d.precision_start == 'day' && d.precision_end == 'day'
        })
        .attr('key', function(d) {
          return d.id
        })
        .merge(story)
        .style('opacity', 0)
        .attr('transform', d => {
          return `translate(0,${ selectedVolume.value.indexOf(d)*subHeight + y(selectedVolume.key) + y.bandwidth() })`
        })

      story.transition()
        .duration(duration)
        .delay((d, i) => {
          return i * (duration / selectedVolume.value.length)
        })
        .style('opacity', 1)

      storyBaseline = story.selectAll('.baseline').data(function(d) {
        return d.start && d.end ? [d] : []
      })
      storyBaseline.exit().remove()
      storyBaseline = storyBaseline.enter().append('line')
        .classed('baseline', true)
        .merge(storyBaseline)

      storySpan = story.selectAll('.span').data(function(d) {
        return d.start && d.end ? [d] : []
      })
      storySpan.exit().remove()
      storySpan = storySpan.enter().append('line')
        .classed('span', true)
        .classed('precise', d => {
          return d.precision_start == 'day' && d.precision_end == 'day'
        })
        .merge(storySpan)

      storyStart = story.selectAll('.start').data(function(d) {
        return d.start ? [d] : []
      })
      storyStart.exit().remove()
      storyStart = storyStart.enter().append('path')
        .classed('start', true)
        .classed('precise', d => {
          return d.precision_start == 'day'
        })
        .merge(storyStart)

      storyEnd = story.selectAll('.end').data(function(d) {
        return d.end ? [d] : []
      })
      storyEnd.exit().remove()
      storyEnd = storyEnd.enter().append('path')
        .classed('end', true)
        .classed('precise', d => {
          return d.precision_end == 'day'
        })
        .merge(storyEnd)

      storyPublication = story.selectAll('.publication').data(function(d) {
        let datum = publications.filter(e => {
          return e.id == d.id
        })
        datum = datum.sort(function(a, b) {
          return a.publication - b.publication
        })
        return datum
      })
      storyPublication.exit().remove()
      storyPublication = storyPublication.enter().append('path')
        .classed('publication', true)
        .attr('d', d3.symbol().type(function(d, i) {
          return i == 0 ? symbolFirstPublication : diamond
        }).size(function(d, i) {
          let thisSize = 10
          return i == 0 ? thisSize : thisSize * 1
        }))
        .merge(storyPublication)
        .on('click', function(d) {
          showDate(d, d3.event);
        })

      // labels
      storyLabel = labels.selectAll('.story-label').data(selectedVolume.value, d => {
        return d.id
      })
      storyLabel.exit().transition().duration(duration).style('opacity', 1e-16).remove()
      storyLabel = storyLabel.enter().append('text')
        .classed('story-label', true)
        .attr('x', margin.left - 60)
        .text(d => {
          return d.titolo
        })
        .merge(storyLabel)
        .style('opacity', 0)
        .attr('y', d => {
          return selectedVolume.value.indexOf(d) * subHeight + y(selectedVolume.key) + y.bandwidth() + 28
        })

      storyLabel.transition()
        .duration(duration)
        .delay((d, i) => {
          return i * (duration / selectedVolume.value.length)
        })
        .style('opacity', 1)

      newHeight = selectedVolume ? height + selectedVolume.value.length * subHeight : height;
      ganttSVG.attr('height', newHeight)
      d3.select('#clip rect').attr('height', newHeight)
      pannable.attr('height', newHeight)

    }

    storyBaseline.attr('x1', function(d) {
        return x(d.start)
      })
      .attr('y1', y.bandwidth() / 2)
      .attr('x2', x(x.domain()[1]))
      .attr('y2', y.bandwidth() / 2)

    storySpan.attr('x1', d => {
        return x(d.start)
      })
      .attr('x2', d => {
        return x(d.end)
      })
      .attr('y1', y.bandwidth() / 2)
      .attr('y2', y.bandwidth() / 2)

    storyStart.attr('d', d => {
        return termination(d, 'path', 'start')
      })
      .attr('transform', d => {
        return termination(d, 'transform', 'start')
      })

    storyEnd.attr('d', d => {
        return termination(d, 'path', 'end')
      })
      .attr('transform', d => {
        return termination(d, 'transform', 'end')
      })

    storyPublication
      .attr('transform', function(d) {
        return `translate(${x(d.publication)}, ${ 13 })`
      })

    selectedDate.attr('transform', function(d) {
      return 'translate(' + (margin.left + x(d.publication)) + ', 25)'
    })

    selectedDateLine
      .attr('x1', function(d) {
        return x(d.publication)
      })
      .attr('x2', function(d) {
        return x(d.publication)
      })

    selectedMag
      .attr('x', function(d) {
        return x(d.publication)
      })

  }

  function termination(story, attr, type) {

    if (type == 'start') {
      if (attr == 'path') {
        if (story.precision_start == 'day') {
          return 'M 0,-6 L 0,1 Z'
        } else if (story.precision_start == 'month') {
          return 'M3.5,0.5c-1.7,0-3,1-3,5.5s1.3,5.5,3,5.5'
        } else if (story.precision_start == 'year') {
          return 'M3.5,0.5c-1.7,0-3,1-3,5.5s1.3,5.5,3,5.5'
        }
      } else if (attr == 'transform') {
        if (story.precision_start == 'day') {
          return 'translate(' + x(story.start) + ', ' + y.bandwidth() / 2 + ')'
        } else if (story.precision_start == 'month') {
          return 'translate(' + x(story.start) + ',' + (y.bandwidth() / 2 - 6) + ')'
        } else if (story.precision_start == 'year') {
          return 'translate(' + x(story.start) + ',' + (y.bandwidth() / 2 - 6) + ')'
        }
      }
    } else if (type == 'end') {
      if (attr == 'path') {
        if (story.precision_end == 'day') {
          return 'M 0,6 L 0,-1 Z'
        } else if (story.precision_end == 'month') {
          return 'M0,0.5c1.7,0,3,1,3,5.5s-1.3,5.5-3,5.5'
        } else if (story.precision_end == 'year') {
          return 'M0,0.5c1.7,0,3,1,3,5.5s-1.3,5.5-3,5.5'
        }
      } else if (attr == 'transform') {
        if (story.precision_end == 'day') {
          return 'translate(' + x(story.end) + ', ' + y.bandwidth() / 2 + ')'
        } else if (story.precision_end == 'month') {
          return 'translate(' + (x(story.end) - 3) + ',' + (y.bandwidth() / 2 - 6) + ')'
        } else if (story.precision_end == 'year') {
          return 'translate(' + (x(story.end) - 3) + ',' + (y.bandwidth() / 2 - 6) + ')'
        }
      }
    }


  }

  let dateFormatter1 = d3.timeFormat('%e %B %Y')

  function showDate(data) {

    if (data) {

      selectedDate = selectedDate.data([data], function(d) {
        return d.publication
      })

      selectedDate.exit()
        .transition()
        .duration(500)
        .style('opacity', 0)
        .remove()

      selectedDate = selectedDate.enter().append('text')
        .classed('date-tooltip', true)
        .attr('transform', function(d) {
          return 'translate(' + (margin.left + x(d.publication)) + ', -10)'
        })
        .merge(selectedDate)
        .text(function(d) {
          return dateFormatter1(d.publication)
        })

      selectedDate.transition()
        .duration(500)
        .style('opacity', 1)
        .attr('transform', function(d) {
          return 'translate(' + (margin.left + x(d.publication)) + ', 25)'
        })

      selectedDateLine = selectedDateLine.data([data], function(d) {
        return d.publication
      })

      selectedDateLine.exit()
        .transition()
        .duration(500)
        .style('opacity', 0)
        .remove()

      selectedDateLine = selectedDateLine.enter().append('line')
        .classed('selected-date-line', true)
        .attr('x1', function(d) {
          return x(d.publication)
        })
        .attr('y1', 0)
        .attr('x2', function(d) {
          return x(d.publication)
        })
        .attr('y2', newHeight)
        .merge(selectedDateLine)

      selectedMag = selectedMag.data([])
      selectedMag.exit()
        .transition()
        .duration(500)
        .style('opacity', 0)
        .remove()

      selectedMag = selectedMag.data([data], function(d) {
        d.event = d3.event
        return d.id + '|' + d.publication
      })
      selectedMag.exit()
        .transition()
        .duration(500)
        .style('opacity', 0)
        .remove()

      selectedMag = selectedMag.enter().append('text')
        .classed('selected-mag', true)
        .text(function(d) {
          let pubs = publications.filter(function(e) {
            return e.id == d.id && e.publication == d.publication
          })
          return pubs[0].nome
        })
        .attr('x', function(d) {
          return x(d.publication)
        })
        .attr('y', function(d) {
          return d.event.offsetY - 10
        })
        .merge(selectedMag)

    } else {
      selectedDate = selectedDate.data([])
      selectedDate.exit()
        .transition()
        .duration(500)
        .style('opacity', 0)
        .remove()

      selectedDateLine = selectedDateLine.data([])
      selectedDateLine.exit()
        .transition()
        .duration(500)
        .style('opacity', 0)
        .remove()

      selectedMag = selectedMag.data([])
      selectedMag.exit().remove()
    }

  }

} // gantt
