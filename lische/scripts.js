window.onload = function() {
  document.onselectstart = function() {
    return false;
  }
}

let selectedItems = [];
let selectionType = null;

let visualisation = 'lische-web.svg';

// visualisation = "lische_verticale-interattivo20.svg";

d3.xml(visualisation).then(function(xml) {
  // console.log(xml)
  let svg = d3.select(xml).select('svg').node()
  // console.log(svg)
  d3.select('div.lische').node().appendChild(svg)

  let viz = d3.select('svg');

  viz.selectAll('*[data-name]').each(function(d,i){
    let data_name = d3.select(this).attr('data-name');
    if (data_name) {
      // console.log(this)
      data_name = data_name.replace(/\s/g,'-')
      data_name = data_name.replace(/\|/g,' ')
      d3.select(this).classed(data_name, true);
    }
  })

  d3.selectAll('g.stories > g').on('click', function(d,i){
    resetOpacity();

    d3.selectAll('g.collections > g').style('opacity', .2);
    d3.selectAll('g.collections-labels > g').style('opacity', .2);
    d3.selectAll('g.magazines > g').style('opacity', .2);
    d3.selectAll('g.stories > g').style('opacity', .2);

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
      d3.select('g.magazines > g.'+magazine).style('opacity', 1);
      let collections = d3.select(s).attr('class').split(' ');
      collections.forEach(function(c){
        d3.select('g.collections > g.'+c).style('opacity', 1);
      })
      d3.select(s).style('opacity', 1);
    })

  })

  d3.selectAll('g.magazines > g').on('click', function(d,i){
    resetOpacity();

    d3.selectAll('g.collections > g').style('opacity', .2);
    d3.selectAll('g.collections-labels > g').style('opacity', .2);
    d3.selectAll('g.magazines > g').style('opacity', .2);
    d3.selectAll('g.stories > g').style('opacity', .2);

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
      d3.select(m).style('opacity', 1);
      let thisClass = d3.select(m).attr('class');
      let collections = [];
      d3.selectAll('g.stories > g.'+thisClass)
        .style('opacity', 1)
        .each(function(s){
          let classes = d3.select(this).attr('class').split(' ');
          classes.forEach( (c) => {
            d3.select('g.collections > g.'+c).style('opacity',1);
          })
        });
    })

  })

  d3.selectAll('g.collections > g, g.collections-labels > g').on('click', function(d,i){
    resetOpacity();

    d3.selectAll('g.stories > g').style('opacity', .2);
    d3.selectAll('g.magazines > g').style('opacity',.2);
    d3.selectAll('g.collections > g').style('opacity',.2);
    d3.selectAll('g.collections-labels > g').style('opacity', .2);

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
        .style('opacity', 1)
        .each(function(s){
          let thisMagazine = d3.select(this).attr('class').split(' ')[1];
          magazines.push(thisMagazine);
        });
      magazines.forEach(function(m){
        d3.select('g.magazines > g.'+m).style('opacity',1);
      })

      // d3.select(c).style('opacity',1)
      d3.select('g.collections > g.'+thisClass).style('opacity', 1);
      d3.select('g.collections-labels > g.'+thisClass).style('opacity', 1);

    })

  })

  d3.select('.reset').on('click', function(d){
    console.log('reset')
    resetOpacity();
  })

  function resetOpacity() {
    d3.selectAll('g.stories > g').style('opacity', 1);
    d3.selectAll('g.magazines > g').style('opacity', 1);
    d3.selectAll('g.collections > g').style('opacity', 1);
    d3.selectAll('g.collections-labels > g').style('opacity', 1);
  }

})
