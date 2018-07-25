console.info('stesure.js')

let ganttChart

var parseDate = d3.timeParse("%Y-%m-%d")

let data


function gantt(data) {

  // Convert the data into a usable format
  let converted = convertData(data);
  // console.log(converted)
  var writings = converted.writings
  var info = converted.info
  var publications = converted.publications
  var groups = converted.groups

  var elem = document.getElementById("gantt");

  // Set dimentions
  var groupBoxStyle = window.getComputedStyle(elem, null);
  let width = parseInt(groupBoxStyle.width)
  width -= parseInt(groupBoxStyle.paddingLeft)
  width -= parseInt(groupBoxStyle.paddingRight)
  width -= 15

  let height = 50 * groups.length
  let newHeight = height

  let margin = {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  }

  let groupsSvg = d3.select('div#gantt > svg')
    .attr('width', width)
    .attr('height', height)
    // .append('g').attr('class', 'main-g')

  let timeSvg = d3.select('#time-scale > svg')
    .attr('height', 25)
    .attr('width', width)

  let brushSvg = d3.select('#brush > svg')
    .attr('height', 100)
    .attr('width', width)

  let groupScale = d3.scaleBand()
    .domain(groups.map(d => {
      return d.key
    }))
    .range([50, height])
    .padding(0)

  let symbol = d3.symbol().size(360);
  let symbol2 = d3.symbol().size(50);

  let group

  let groupBG
  let groupTitle
  let groupTriangle
  let groupLine
  let groupSpan1 // daily precision
  let groupSpan2 // not daily precision
  let groupPublication
  let subGroup

  let sgTitle
  let sgLine
  let sgWriting
  let sgPublication
  let writingStart
  let writingEnd

  group = groupsSvg.selectAll('.group').data(groups, d => {
    return d.key
  })
  group.exit().remove()
  group = group.enter().append('g')
    .classed('group', true)
    .classed('composite', d => {
      return d.value.length > 1 ? true : false
    })
    .merge(group)

  groupBG = group.selectAll('.bg').data(function(d) {
    return [d]
  })
  groupBG.exit().remove()
  groupBG = groupBG.enter().append('rect')
    .classed('bg', true)
    .attr('x', 0)
    .attr('y', -25)
    .attr('width', width * 3)
    .attr('height', 50)
    .style('opacity', 0)

  groupTitle = group.selectAll('.title').data(function(d) {
    return [d]
  })
  groupTitle.exit().remove()
  groupTitle = groupTitle.enter().append('text')
    .classed('title', true)
    .attr('y', 5)
    .text(d => {
      let title = info.filter(e => {
        return e.id == d.key
      })[0].titolo
      return title;
    })
    .merge(groupTitle)

  // Set the left margin according to the largest title, to main SVG and to Groups BG
  group.attr('transform', d => {
    margin.left = 0;
    groupTitle.each(function(d, i) {
      let thisWidth = d3.select(this).node().getBBox().width;
      margin.left = d3.max([margin.left, thisWidth])
    })
    margin.left += 14
    return `translate(${margin.left},${groupScale(d.key)})`;
  })
  groupBG.attr('x', 0 - margin.left - margin.right)

  // After margin is set, draw the temporal axis at the bottom, in a different SVG so to make it sticky via CSS
  let timeScale = d3.scaleTime()
    .domain([parseDate('1940-01-01'), parseDate('1990-12-31')])
    .range([80, width - margin.left - margin.right - 80])
  let timeAxis = d3.axisBottom(timeScale)
    .ticks(d3.timeYear.every(5))
    .tickPadding(7)
  timeSvg.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(" + margin.left + "," + 0 + ")")
    .call(timeAxis);

  groupTriangle = group.selectAll('.triangle').data(function(d) {
    return d.value.length > 1 ? [d] : []
  })
  groupTriangle.exit().remove()
  groupTriangle = groupTriangle.enter().append('path')
    .classed('triangle', true)
    .attr('d', symbol.type(d3['symbolTriangle'])())
    .attr('transform', 'translate(40,0) rotate(90)')
    .merge(groupTriangle)
    .on('click', function(d) {
      // Toggle the “expanded” class
      d3.select(this).classed("expanded", !d3.select(this).classed("expanded"))
      // Check if the class is currently assigned, if so expand, if not collapse

      if (d3.select(this).classed("expanded")) {
        expand(this, d, d3.select(this).classed("expanded"))
      } else {
        collapse()
      }
    })

  groupLine = group.selectAll('.line').data(function(d) {
    return [d]
  })
  groupLine.exit().remove()
  groupLine = groupLine.enter().append('line')
    .classed('line', true)
    .attr('x1', timeScale(timeScale.domain()[0]))
    .attr('y1', 0)
    .attr('x2', timeScale(timeScale.domain()[1]))
    .attr('y2', 0)
    .merge(groupLine)

  groupSpan1 = group.selectAll('.span1').data(function(d) {
    let items = d.value.filter(e => {
      return e.precision_start != 'day' && e.precision_end != 'day'
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
        end: end
      }
      return [datum]
    } else {
      return []
    }
  })
  groupSpan1.exit().remove()
  groupSpan1 = groupSpan1.enter().append('rect')
    .classed('span1', true)
    .attr('x', d => {
      return timeScale(d.start)
    })
    .attr('y', -6)
    .attr('width', d => {
      return timeScale(d.end) - timeScale(d.start)
    })
    .attr('height', 12)
    .merge(groupSpan1)

  groupSpan2 = group.selectAll('.span2').data(function(d) {
    let items = d.value.filter(e => {
      return e.precision_start == 'day' && e.precision_end == 'day'
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
      return [datum]
    } else {
      return []
    }
  })
  groupSpan2.exit().remove()
  groupSpan2 = groupSpan2.enter().append('rect')
    .classed('span2', true)
    .attr('x', d => {
      return timeScale(d.start)
    })
    .attr('y', -6)
    .attr('width', d => {
      return timeScale(d.end) - timeScale(d.start)
    })
    .attr('height', 12)
    .merge(groupSpan2)

  groupPublication = group.selectAll('.publication').data(function(d) {
    let datum = publications.filter(e => {
      return e.id == d.key
    })
    return datum
  })
  groupPublication.exit().remove()
  groupPublication = groupPublication.enter().append('path')
    .classed('publication', true)
    .attr('d', symbol2.type(d3['symbolCross'])())
    .attr('transform', d => {
      return `translate(${timeScale(d.publication)},0) rotate(45)`;
    })
    .merge(groupPublication)

  // Here start the declaration of subgroups
  subGroup = groupsSvg.selectAll('.subGroup').data([])
  subGroup.exit().remove()
  subGroup = subGroup.enter().append('g')
    .classed('subGroup', true)
    .attr('transform', `translate(${margin.left},0)`)
    .merge(subGroup)

  // Define elements for the brush
  groupsSvg.append("defs").append("clipPath")
    .attr("id", "clip")
    .append("rect")
    .attr('x', timeScale.range()[0] + margin.left)
    .attr('y', 0)
    .attr("width", timeScale.range()[1])
    .attr("height", height);

  let brushScale = d3.scaleTime()
    .domain([parseDate('1940-01-01'), parseDate('1990-12-31')])
    .range([80, width - margin.left - margin.right - 80])
  let brushAxis = d3.axisBottom(brushScale)
    .ticks(d3.timeYear.every(5))
    .tickPadding(7)
  brushSvg.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(" + margin.left + "," + 60 + ")")
    .call(brushAxis);

  var brush = d3.brushX()
    .extent([
      [80, 0],
      [width - margin.left - margin.right - 80, 15]
    ])
    .on("brush end", brushed);

  let brush_g = brushSvg.append('g')
    .attr("transform", "translate(" + margin.left + "," + 40 + ")")
  brush_g.append('rect')
    .classed('test', true)
    .attr('x', brushScale(brushScale.domain()[0]))
    .attr('y', 0)
    .attr('height', 15)
    .attr('width', brushScale(brushScale.domain()[1]) - brushScale(brushScale.domain()[0]))

  brush_g.append("g")
    .attr("class", "brush")
    .call(brush)
    .call(brush.move, brushScale.range());

  function brushed() {
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom

    var s = d3.event.selection || brushScale.range();
    timeScale.domain(s.map(brushScale.invert, brushScale));
    // console.log('brush')
    update();
  }

  function update() {
    // console.log('updating sizes')
    timeSvg.select(".axis--x").call(timeAxis);
    groupSpan1.attr('x', d => {
        return timeScale(d.start)
      })
      .attr('width', d => {
        return timeScale(d.end) - timeScale(d.start)
      })
    groupSpan2.attr('x', d => {
        return timeScale(d.start)
      })
      .attr('width', d => {
        return timeScale(d.end) - timeScale(d.start)
      })
    groupPublication.attr('transform', d => {
      return `translate(${timeScale(d.publication)},0) rotate(45)`;
    })

    sgWriting.attr('x1', d => {
        return d.start ? timeScale(d.start) : null
      })
      .attr('y1', 0)
      .attr('x2', d => {
        return d.start ? timeScale(d.end) : null
      })
      .attr('y2', 0)
    sgPublication.attr('transform', (d, i) => {
      return i == 0 ? `translate(${timeScale(d.publication)},0) rotate(45)` : `translate(${timeScale(d.publication)},0)`;
    })
    writingStart.attr('d', d => {
        let newEnd;
        if (d.precision_start == 'month') {
          let year = d.start.getFullYear()
          let month = d.start.getMonth()
          let day = d.start.getDate()
          if (month < 11) {
            newEnd = new Date(year, month + 1, 0)
          } else {
            newEnd = new Date(year, 11, 31)
          }
        }
        return d.precision_start == 'year' ?
          'M3.5,0.5c-1.7,0-3,1-3,5.5s1.3,5.5,3,5.5' :
          d.precision_start == 'month' ?
          'M 0,0 L ' + (d3.max([(timeScale(newEnd) - timeScale(d.start)), 10])) + ',0' :
          'M 0,-6 L 0,1 Z'
      })
      .attr('transform', d => {
        return d.precision_start == 'year' ? 'translate(' + timeScale(d.start) + ',-6)' : 'translate(' + timeScale(d.start) + ',0)'
      })
      writingEnd.attr('d', d => {
          let newEnd;
          if (d.precision_end == 'month') {
            let year = d.end.getFullYear()
            let month = d.end.getMonth()
            let day = d.end.getDate()
            newEnd = new Date(year, month, 1)
          }
          return d.precision_end == 'year' ?
            'M0,0.5c1.7,0,3,1,3,5.5s-1.3,5.5-3,5.5' :
            d.precision_end == 'month' ?
            'M 0,0 L ' + (d3.max([(timeScale(d.end) - timeScale(newEnd)), -10])) + ',0' :
            'M 0,6 L 0,-1 Z'
        })
        .attr('transform', d => {
          return d.precision_end == 'year' ? 'translate(' + (timeScale(d.end) - 3) + ',-6)' : 'translate(' + timeScale(d.end) + ',0)'
        })

  }

  function collapse() {
    let collapseDuration = 0;
    console.log('collapse')
    d3.selectAll('.triangle').transition().duration(500).attr('transform', 'translate(40,0) rotate(90)')
    d3.selectAll('#gantt g.group').each(function(d, i) {
      d3.select(this).select('.bg').transition()
        .duration(250)
        .attr('height', 50)
        .style('opacity', 0)

      d3.select(this).transition()
        .duration(500)
        .delay(i * 25)
        .attr('transform', d => {
          return `translate(${margin.left},${groupScale(d.key)})`;
        })
    })
    groupsSvg.transition().duration(collapseDuration).attr('height', height)

    subGroup = groupsSvg.selectAll('.subGroup').data([]).exit().remove()
  }

  function expand(triangle, data) {
    collapse()
    // console.log('expand', data)
    d3.select(triangle).transition().duration(500).attr('transform', 'translate(40,0) rotate(180)')

    let selectedIndex = -1;
    let yPosition
    let subHeight = 25

    d3.selectAll('#gantt g.group').each(function(d, i) {

      // Get the index of the selected group
      selectedIndex = d.key == data.key ? i : selectedIndex

      // Expand the group if the index matches
      if (i == selectedIndex) {

        yPosition = groupScale(d.key)

        d3.select(this).select('.bg').transition()
          .duration(250)
          .attr('height', 50 + data.value.length * subHeight)
          .style('opacity', .25)

        // Bind data to the sub group and sort it according to the earliest starting date of the stories writings
        subGroup = groupsSvg.selectAll('.subGroup').data(data.value.sort(function(a, b) {
          return a.start - b.start
        }))
        subGroup.exit().remove()
        subGroup = subGroup.enter().append('g')
          .classed('subGroup', true)
          .classed('precise', d => {
            return d.precision_start == 'day' && d.precision_end == 'day'
          })
          .attr('sg-id', function(d) {
            return d.id
          })
          .attr('transform', d => {
            return `translate(${ margin.left },${ data.value.indexOf(d)*25 + yPosition + 5 + subHeight })`
          })
          .merge(subGroup)

        sgTitle = subGroup.selectAll('.title').data(function(d) {
          return [d.titolo]
        })
        sgTitle.exit().remove()
        sgTitle = sgTitle.enter().append('text')
          .classed('title', true)
          .text(d => {
            return d
          })
          .merge(sgTitle)

        sgLine = subGroup.selectAll('.line').data(function(d) {
          return [d]
        })
        sgLine.exit().remove()
        sgLine = sgLine.enter().append('line')
          .classed('line', true)
          .attr('x1', timeScale(timeScale.domain()[0]))
          .attr('y1', 0)
          .attr('x2', timeScale(timeScale.domain()[1]))
          .attr('y2', 0)
          .merge(sgLine)

        sgWriting = subGroup.selectAll('.writing').data(function(d) {
          return [d]
        })
        sgWriting.exit().remove()
        sgWriting = sgWriting.enter().append('line')
          .classed('writing', true)
          .attr('x1', d => {
            return d.start ? timeScale(d.start) : null
          })
          .attr('y1', 0)
          .attr('x2', d => {
            return d.start ? timeScale(d.end) : null
          })
          .attr('y2', 0)
          .merge(sgWriting)

        sgPublication = subGroup.selectAll('.publication').data(function(d) {
          let datum = publications.filter(e => {
            return e.id == d.id
          }).sort(function(a, b) {
            return a.publication - b.publication
          })
          return datum
        })
        sgPublication.exit().remove()
        sgPublication = sgPublication.enter().append('path')
          .classed('publication', true)
          .classed('not-first', (d, i) => {
            return i > 0
          })
          .attr('d', (d, i) => {
            return i == 0 ? symbol2.type(d3['symbolCross'])() : symbol2.type(d3['symbolDiamond'])()
          })
          .attr('transform', (d, i) => {
            return i == 0 ? `translate(${timeScale(d.publication)},0) rotate(45)` : `translate(${timeScale(d.publication)},0)`;
          })
          .merge(sgPublication)

        writingStart = subGroup.selectAll('.writing-start').data(d => {
          return d.start ? [d] : []
        })
        writingStart.exit().remove()
        writingStart = writingStart.enter().append('path')
          .classed('termination start', true)

          .classed('year-precision', d => {
            return d.precision_start == 'year'
          })
          .classed('month-precision', d => {
            return d.precision_start == 'month'
          })
          .classed('day-precision', d => {
            return d.precision_start == 'day'
          })

          .attr('d', d => {
            let newEnd;
            if (d.precision_start == 'month') {
              let year = d.start.getFullYear()
              let month = d.start.getMonth()
              let day = d.start.getDate()
              if (month < 11) {
                newEnd = new Date(year, month + 1, 0)
              } else {
                newEnd = new Date(year, 11, 31)
              }
            }
            return d.precision_start == 'year' ?
              'M3.5,0.5c-1.7,0-3,1-3,5.5s1.3,5.5,3,5.5' :
              d.precision_start == 'month' ?
              'M 0,0 L ' + (d3.max([(timeScale(newEnd) - timeScale(d.start)), 10])) + ',0' :
              'M 0,-6 L 0,1 Z'
          })
          .attr('transform', d => {
            return d.precision_start == 'year' ? 'translate(' + timeScale(d.start) + ',-6)' : 'translate(' + timeScale(d.start) + ',0)'
          })
          .merge(writingStart)

        writingEnd = subGroup.selectAll('.writing-end').data(d => {
          return d.end ? [d] : []
        })
        writingEnd.exit().remove()
        writingEnd = writingEnd.enter().append('path')
          .classed('termination end', true)

          .classed('year-precision', d => {
            return d.precision_end == 'year'
          })
          .classed('month-precision', d => {
            return d.precision_end == 'month'
          })
          .classed('day-precision', d => {
            return d.precision_end == 'day'
          })

          .attr('d', d => {
            let newEnd;
            if (d.precision_end == 'month') {
              let year = d.end.getFullYear()
              let month = d.end.getMonth()
              let day = d.end.getDate()
              newEnd = new Date(year, month, 1)
            }
            return d.precision_end == 'year' ?
              'M0,0.5c1.7,0,3,1,3,5.5s-1.3,5.5-3,5.5' :
              d.precision_end == 'month' ?
              'M 0,0 L ' + (d3.max([(timeScale(d.end) - timeScale(newEnd)), -10])) + ',0' :
              'M 0,6 L 0,-1 Z'
          })
          .attr('transform', d => {
            return d.precision_end == 'year' ? 'translate(' + (timeScale(d.end) - 3) + ',-6)' : 'translate(' + timeScale(d.end) + ',0)'
          })
          .merge(writingEnd)

      } else {
        d3.select(this).select('.bg').transition()
          .duration(250)
          .attr('height', 50)
          .style('opacity', 0)
      }

      if (selectedIndex > -1 && i > selectedIndex) {
        d3.select(this).transition()
          .duration(500)
          // .delay(i * 25)
          .attr('transform', d => {
            return `translate(${margin.left},${groupScale(d.key) + data.value.length*subHeight})`;
          })
      } else {
        d3.select(this).transition()
          .duration(500)
          .delay((selectedIndex - i) * 25)
          .attr('transform', d => {
            return `translate(${margin.left},${groupScale(d.key)})`;
          })
      }
      newHeight = height + data.value.length * subHeight
      console.log(height, newHeight, data.value.length * subHeight)
      groupsSvg.transition().duration(100).delay(10).attr('height', newHeight)
    })
  }

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
  groups.sort(function(a, b) {
    return a.start - b.start
  })

  data = {
    'writings': writings,
    'info': info,
    'publications': publications,
    'groups': groups
  }

  return data
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

function init() {
  Tabletop.init({
    key: 'https://docs.google.com/spreadsheets/d/1UPiuY_6vEu-bXPEcZTf8BAVuQIzDsIIfsvoDhwN18Iw/edit?usp=sharing',
    callback: formatData,
    simpleSheet: false
  })
}
window.addEventListener('DOMContentLoaded', init)
