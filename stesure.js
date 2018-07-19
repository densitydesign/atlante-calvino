console.info('stesure.js')

var parseDate = d3.timeParse("%Y-%m-%d");

function draw(data) {

  var writings = data.stesure.elements
  var info = data.info.elements
  var publications = data.pubblicazioni.elements
  var groups = data.gruppi.elements.filter(d => {
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

  console.info('display groups', groups)

  var elem = document.getElementById("gantt");
  var groupBoxStyle = window.getComputedStyle(elem, null);

  let margin = {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  }
  let width = parseInt(groupBoxStyle.width) - parseInt(groupBoxStyle.paddingLeft) - parseInt(groupBoxStyle.paddingRight) - parseInt(groupBoxStyle.marginLeft) - parseInt(groupBoxStyle.marginRight)
  let height = 150 + 50 * groups.length

  let groupsSvg = d3.select('div#gantt > svg')
    .attr('width', width)
    .attr('height', height)

  let groupScale = d3.scaleBand()
    .domain(groups.map(d => {
      return d.key
    }))
    .range([50, height])

  let group = groupsSvg.selectAll('.group').data(groups, d => {
    return d.key
  })

  group.exit().remove();

  group = group.enter().append('g')
    .classed('group', true)
    .classed('composite', d => {
      return d.value.length > 1 ? true : false
    })
    .merge(group);

  let groupBG = group.selectAll('.bg').data(function(d) {
    return [d]
  })

  groupBG.exit().remove()

  groupBG = groupBG.enter().append('rect')
    .classed('bg', true)
    .attr('x', 0)
    .attr('y', -25)
    .attr('width', width*3)
    .attr('height', 50)

  let groupTitle = group.selectAll('.title').data(function(d) {
    return [d]
  })

  groupTitle.exit().remove()

  groupTitle = groupTitle.enter().append('text')
    .classed('title', true)
    .attr('y',5)
    .text(d => {
      let title = info.filter(e => {
        return e.id == d.key
      })[0].titolo
      return title;
    })
    .merge(groupTitle)

  group.transition()
    .duration(0)
    .attr('transform', d => {
      margin.left = 0;
      groupTitle.each(function(d, i) {
        let thisWidth = d3.select(this).node().getBBox().width;
        margin.left = d3.max([margin.left, thisWidth])
      })
      return `translate(${margin.left},${groupScale(d.key)-25})`;
    })

  groupBG.attr('x', 0-margin.left-margin.right)

  let timeScale = d3.scaleTime()
    .domain([parseDate('1940-01-01'), parseDate('1990-12-31')])
    .range([80, width - margin.left - margin.right])

  let symbol = d3.symbol().size(72);

  let groupTriangle = group.selectAll('.triangle').data(function(d) {
    return d.value.length > 1 ? [d] : []
  })

  groupTriangle.exit().remove()

  groupTriangle = groupTriangle.enter().append('path')
    .classed('triangle', true)
    .attr('d', symbol.type(d3['symbolTriangle'])())
    .attr('transform', 'translate(40,0) rotate(90)')
    .merge(groupTriangle)
    .on('click', function(d) {
      console.log('expand')
    })

  let groupLine = group.selectAll('.line').data(function(d) {
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

  let groupSpan1 = group.selectAll('.span1').data(function(d) {
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
    .attr('y', -5)
    .attr('width', d => {
      return timeScale(d.end) - timeScale(d.start)
    })
    .attr('height', 8)
    .merge(groupSpan1)

  let groupSpan2 = group.selectAll('.span2').data(function(d) {
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
    .attr('y', -3)
    .attr('width', d => {
      return timeScale(d.end) - timeScale(d.start)
    })
    .attr('height', 8)
    .merge(groupSpan2)


  let groupPublication = group.selectAll('.publication').data(function(d) {
    let datum = publications.filter(e => {
      return e.id == d.key
    })
    return datum
  })

  groupPublication.exit().remove()

  groupPublication = groupPublication.enter().append('circle')
    .classed('publication', true)
    .attr('cx', d => {
      return timeScale(d.publication)
    })
    .attr('cy', 0)
    .attr('r', 3)
    .merge(groupPublication)

}

function formatData(data) {
  console.log('data is loaded')
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
  draw(data)
}

function init() {
  Tabletop.init({
    key: 'https://docs.google.com/spreadsheets/d/1UPiuY_6vEu-bXPEcZTf8BAVuQIzDsIIfsvoDhwN18Iw/edit?usp=sharing',
    callback: formatData,
    simpleSheet: false
  })
}
window.addEventListener('DOMContentLoaded', init)
