// window.onload = function() {
//   document.onselectstart = function() {
//     return false;
//   }
// }

let selectedItems = [];
let selectionType = null;

d3.xml("SVG/header-viz.svg").then(function(xml) {
  let svg = d3.select(xml).select('svg').node()
  d3.select(svg).attr('class','info sticky-top')
  d3.select('div.lische').node().appendChild(svg)
})

d3.xml('SVG/visualisation.svg').then(function(xml) {
  let svg = d3.select(xml).select('svg').node()
  d3.select(svg).attr('class','visualisation')
  d3.select('div.lische').node().appendChild(svg)

  let viz = d3.select('svg.visualisation');

  viz.selectAll('*[data-name]').each(function(d,i){
    let data_name = d3.select(this).attr('data-name');
    if (data_name) {
      data_name = data_name.replace(/\s/g,'-')
      data_name = data_name.replace(/\|/g,' ')
      d3.select(this).classed(data_name, true);
    }
  })

  d3.selectAll('g.stories > g').on('click', function(d,i){
    resetOpacity();

    d3.selectAll('g.collections > g').transition().duration(250).style('opacity', .2);
    d3.selectAll('g.collections-labels > g').transition().duration(250).style('opacity', .5);
    d3.selectAll('g.magazines > g').transition().duration(250).style('opacity', .2);
    d3.selectAll('g.stories > g').transition().duration(250).style('opacity', .2);

    if (d3.event.shiftKey && selectionType == 'story') {
      selectedItems.push(this);
    } else {
      selectedItems = []
    }
    if (selectedItems.length < 1) {
      selectedItems.push(this)
      selectionType = 'story'
    }

    selectedItems.forEach(function(s){
      let magazine = d3.select(s).attr('class').split(' ')[1];
      d3.select('g.magazines > g.'+magazine).transition().duration(250).style('opacity', 1);
      let collections = d3.select(s).attr('class').split(' ');
      collections.forEach(function(c){
        d3.select('g.collections > g.'+c).transition().duration(250).style('opacity', 1);
      })
      d3.select(s).transition().duration(250).style('opacity', 1);
    })

    document.getSelection().removeAllRanges();

  })

  d3.selectAll('g.magazines > g').on('click', function(d,i){
    resetOpacity();

    d3.selectAll('g.collections > g').transition().duration(250).style('opacity', .2);
    d3.selectAll('g.collections-labels > g').transition().duration(250).style('opacity', .5);
    d3.selectAll('g.magazines > g').transition().duration(250).style('opacity', .2);
    d3.selectAll('g.stories > g').transition().duration(250).style('opacity', .2);

    if (d3.event.shiftKey && selectionType == 'magazine') {
      selectedItems.push(this);
    } else {
      selectedItems = []
    }
    if (selectedItems.length < 1) {
      selectedItems.push(this)
      selectionType = 'magazine'
    }

    selectedItems.forEach(function(m){
      d3.select(m).transition().duration(250).style('opacity', 1);
      let thisClass = d3.select(m).attr('class');
      let collections = [];
      d3.selectAll('g.stories > g.'+thisClass)
        .transition().duration(250).style('opacity', 1)
        .each(function(s){
          let classes = d3.select(this).attr('class').split(' ');
          classes.forEach( (c) => {
            d3.select('g.collections > g.'+c).transition().duration(250).style('opacity',1);
          })
        });
    })

    document.getSelection().removeAllRanges();

  })

  d3.selectAll('g.collections > g, g.collections-labels > g').on('click', function(d,i){
    resetOpacity();

    d3.selectAll('g.stories > g').transition().duration(250).style('opacity', .2);
    d3.selectAll('g.magazines > g').transition().duration(250).style('opacity', .2);
    d3.selectAll('g.collections > g').transition().duration(250).style('opacity', .2);
    d3.selectAll('g.collections-labels > g').transition().duration(250).style('opacity', .5);

    if (d3.event.shiftKey && selectionType == 'collection') {
      selectedItems.push(this);
    } else {
      selectedItems = []
    }
    if (selectedItems.length < 1) {
      selectedItems.push(this)
      selectionType = 'collection'
    }

    selectedItems.forEach(function(c){

      let thisClass = d3.select(c).attr('class');
      let magazines = [];
      d3.selectAll('g.stories > g.'+thisClass)
        .transition().duration(250).style('opacity', 1)
        .each(function(s){
          let thisMagazine = d3.select(this).attr('class').split(' ')[1];
          magazines.push(thisMagazine);
        });
      magazines.forEach(function(m){
        d3.select('g.magazines > g.'+m).transition().duration(250).style('opacity',1);
      })

      // d3.select(c).transition().duration(250).style('opacity',1)
      d3.select('g.collections > g.'+thisClass).transition().duration(250).style('opacity', 1);
      d3.select('g.collections-labels > g.'+thisClass).transition().duration(250).style('opacity', 1);

    })

    document.getSelection().removeAllRanges();

  })

  d3.select('.reset').on('click', function(d){
    console.log('reset')
    resetOpacity();
  })

  function resetOpacity() {
    d3.selectAll('g.stories > g').transition().duration(250).style('opacity', 1);
    d3.selectAll('g.magazines > g').transition().duration(250).style('opacity', 1);
    d3.selectAll('g.collections > g').transition().duration(250).style('opacity', 1);
    d3.selectAll('g.collections-labels > g').transition().duration(250).style('opacity', 1);
  }

})
