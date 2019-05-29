let w = window.innerWidth
let h = window.innerHeight - 6
let svg = d3
  .select('svg')
  .attr('width', w)
  .attr('height', h)
  .style('background-color','var(--main-bg-color)')

d3
  .json("data.json")
  .then(
    function(json)
    {
      console.log(json.nodes)

      let json_nodes = json.nodes
      // let json_nodes = json.nodes.slice(0, 1)

      json_nodes.forEach(
        function(n)
        {
          // fix orientation of the viz
          // n.y*=-1;
          n.x*=-1;
          // handle collections
          if (n.attributes.collections){
            n.attributes.collections = n.attributes.collections.split(';')
            // remove last element which is always empty due to the fat that all records end with a ";"
            n.attributes.collections.pop()
          } else {
            n.attributes.collections = []
          }
        })

      // sort node so to have the upper in the background and not covering the ones in the foreground
      json_nodes = json_nodes.sort(function(a, b){return a.y - b.y})

      let collections = getCollections()

      let boundaries = {
        top: d3.min(json_nodes, function(d){ return d.y }),
        right: d3.max(json_nodes, function(d){ return d.x }),
        bottom: d3.max(json_nodes, function(d){ return d.y }),
        left: d3.min(json_nodes, function(d){ return d.x })
      }

      console.log(boundaries)

      let center = {
        x: (boundaries.left + boundaries.right) / 2,
        y: (boundaries.bottom + boundaries.top) / 2
      }

      console.log(center)

      let scale = (w / (boundaries.right - boundaries.left))*0.9

      let colour = d3
        .scaleLinear()
        .domain(d3.extent(json_nodes, function(d){ return d.attributes.first_publication; }))
        .range(['#ff6347','#455A64'])

      let col_collections = d3
        .scaleOrdinal()
        .domain(collections.map(function(d){return d.id}))
        .range(collections.map(function(d){return d.c}))
        .unknown('#ffffff')

      let radialGradient = svg
        .append("defs")
        .append("radialGradient")
        .attr("id", "radial-gradient")

      radialGradient
        .append("stop")
        .attr("offset", "30%")
        .attr("stop-color", "green")

      radialGradient
        .append("stop")
        .attr("offset", "97%")
        .attr("stop-color", "#EFEBE9")

      let g = svg
        .append('g')
        .append('g')
        .attr('class','nodes')

      // Hills
      let svg_nodes = g
        .selectAll('.node')
        .data(json_nodes)
        .enter()
          .append('g')
          .attr('class','node')
          .attr('transform',function(d){
            return 'scale(1,0.5773) translate('+(d.x - center.x)+','+(d.y - center.y)+')'
          })

      // calculate the size of steps for hills
      let size_ext = d3.extent(json.nodes, function(d){return d.size});
      let min_size = size_ext[0]/8;
      let step_increment = -23;

      let steps = svg_nodes
        .selectAll('circle')
        .data(
          function(d)
          {
            // reverse the order of collections, so to have the older ones at the bottom of the hills
            d.attributes.collections = d.attributes.collections.reverse()

            d.steps = []
            // get different radii
            for (var jj = (min_size); jj<= d.size; jj+=min_size) {
              let new_step_size = jj;
              let ratio = new_step_size / d.size;
              new_step_size = d.size * interpolateSpline(ratio);
              d.steps.push(new_step_size);
            }

            // get colors
            d.steps = d.steps.map((s,i)=>{

              // assign to each step a collection
              let pos_1 = i/d.steps.length;
              let pos_2 = pos_1 * d.attributes.collections.length;
              let collection_here = d.attributes.collections[Math.floor(pos_2)]
              let first_elem = (i == (d.steps.length-1))

              return {'r': s, 'collection': collection_here, 'first_publication': d.attributes.first_publication, 'id': d.id, 'first_elem': first_elem }
            });

            // sort array so to have little circles on top, big at bottom
            d.steps = d.steps.reverse();

            return d.steps;
          })
        .enter();

        let PI = Math.PI;
        let arcMin = 75; // inner radius of the first arc
        let arcWidth = 15;
        let arcPad = 1; // padding between arcs
        let drawMode = 1; // 1 : hills; 3 : hills with halo; 3 : bicolor rings;

        let drawArc = d3
          .arc()
          .innerRadius(function(d, i) {
              return d.r - (i+1) * arcWidth + arcPad;
          })
          .outerRadius(function(d, i) {
              return d.r - i * arcWidth;
          })
          .startAngle(0 * 2 * PI)
          .endAngle(function(d, i) {
              return 0.6 * 2 * PI;
          })

        let drawArc2 = d3
          .arc()
          .innerRadius(function(d, i) {
              return d.r - (i+1) * arcWidth + arcPad;
          })
          .outerRadius(function(d, i) {
              return d.r - i * arcWidth;
          })
          .startAngle(function(d, i) {
              return 0.6 * 2 * PI;
          })
          .endAngle(function(d, i) {
              return 2 * PI;
          })

      steps
          .filter(function(d) { return d.first_elem } )
          .append("svg:path")
          .attr("fill", "red")
          .attr("d", drawArc)
          .attr('transform', function(d,i){
            i = i*step_increment
            return 'translate(0,'+i+')'
          })
          .style('fill-opacity',0);

      steps
          .filter(function(d) { return d.first_elem } )
          .append("svg:path")
          .attr("fill", "blue")
          .attr("d", drawArc2)
          .attr('transform', function(d,i){
            i = i*step_increment
            return 'translate(0,'+i+')'
          })
          .style('fill-opacity',0);

      steps
          .filter(function(d) { return d.first_elem } )
          .append('circle')
          .attr('fill','url(#radial-gradient)')
          .attr('r',function(d){ return d.r * 1.5 })
          .attr("class", "halo")
          .style('fill-opacity',0)
          .style('stroke-opacity',0)
          .attr('transform', function(d,i){
            i = i*step_increment
            return 'translate(0,'+i+')'
          })

      steps
          .append('circle')
          .attr('stroke','#444')
          .attr('stroke-width',1.5)
          .attr('fill',function(d){
            return colour(d.first_publication)
          })
          // .style('shape-rendering','crispedges')
          .attr('r',function(d){ return d.r })
          .attr('first_elem',function(d){ return d.first_elem })
          .attr("class", "hill" )
          .style('fill-opacity',0)
          .style('stroke-opacity',0)
          .transition()
          .duration(1000)
          .delay(function(d){return (d.first_publication - 1940)*100})
          .attr('transform', function(d,i){
            i = i*step_increment
            return 'translate(0,'+i+')'
          })
          .style('fill-opacity',1)
          .style('stroke-opacity',1)

      svg_nodes
        .on("Xmouseenter", function(){
          d3.selectAll('.node')
            .transition()
            .duration(350)
            .style('opacity',.4)

          d3.select(this)
            .selectAll('circle')
            .transition()
            .duration(350)
            .attr('transform', function(d,i){
              i = i*step_increment*1.5
              return 'translate(0,'+i+')'
            })
        })
        .on("Xmouseleave", function(){
          d3.selectAll('.node')
            .transition()
            .duration(350)
            .style('opacity',1)

          d3.select(this).selectAll('circle')
            .transition()
            .duration(350)
            .style('opacity',1)
            .attr('transform', function(d,i){
              i = i*step_increment
              return 'translate(0,'+i+')'
            })
        })

  let label = svg_nodes
    .selectAll('.label')
    .data(function(d){ return [d] })
    .enter()
      .append('text')
      .attr('class','label')
      .attr('fill','black')
      .attr('font-size','5rem')
      .attr('transform',function(d){
        return 'translate(0,'+(d.steps.length+2)*step_increment+') scale(1,'+1/0.5773+')'
      })
      .text(function(d){
        return d.id+'-'+d.attributes.title+'-'+d.attributes.first_publication;
        return d.id+'-'+d.attributes.first_publication;
      })

  //add zoom capabilities
  var zoom_handler = d3.zoom()
      .on("zoom", zoom_actions);

  zoom_handler(svg);

  centerTerritory(scale, 0, 0, 0);

  //Zoom functions
  function zoom_actions(){
    g.attr("transform", d3.event.transform)
  }

  // Handle interface interactions
  function centerTerritory(scale, x, y, duration) {
    svg.transition()
      .duration(duration)
      .call( zoom_handler.transform, d3.zoomIdentity
        .translate((w/2) + x, (h/2) + y)
        .scale(scale)
      );
  }

  d3.selectAll('.colours-selector span').on('click', function(d){
    setHillsColours(d3.select(this).attr('colour-by'));
  })

  function setHillsColours(coloursBy) {
    switch (coloursBy) {
      case 'years':
        svg_nodes.selectAll('circle')
          .transition()
          .duration(350)
          .attr('fill',function(d){
            return colour(d.first_publication)
          })
        break;
      case 'collections':
        svg_nodes.selectAll('circle')
          .transition().duration(350)
          .attr('fill',function(d){
            return col_collections(d.collection)
          })
        break;
    }
  }

  d3.selectAll('.toggle-timeline').on('click', function(d){
    toggleTimeline();
  })

  function toggleTimeline() {
    d3.select('#timeline-container').classed("visible", d3.select('#timeline-container').classed("visible") ? false : true);
  }

  d3.selectAll('.toggle-legend').on('click', function(d){
    toggleLegend();
  })

  function toggleLegend() {
    $('#legendModal').modal('toggle');
  }

  d3.select('body').on("keyup", function(d) {
      // console.log(d3.event.key)
      if (d3.event.key == "c") {
        svg_nodes.selectAll('circle')
          .transition().duration(350)
          .attr('fill',function(d){
            return col_collections(d.collection)
          })
      } else if (d3.event.key == "y") {
        svg_nodes.selectAll('circle')
          .transition()
          .duration(350)
          .attr('fill',function(d){
            return colour(d.first_publication)
          })
      } else if (d3.event.key == "n") {
        svg_nodes.style('display','none')
        svg_nodes.filter(function(d){
            console.log(d)
            return d.attributes.nebbia
          })
          .style('display','block')
      } else if (d3.event.key == "m") {
        svg_nodes.style('display','none')
        svg_nodes.filter(function(d){
            console.log(d)
            return d.attributes.cancellazione
          })
          .style('display','block')
      } else if (d3.event.key == "p") {

        drawMode = incrementDrawMode(drawMode)

        switch(drawMode)
        {
          case 1 : // hills
            svg_nodes
              .selectAll('path')
              .transition()
              .duration(450)
              .style('fill-opacity',0)
              .style('stroke-opacity',0)

            svg_nodes
              .selectAll('.halo')
              .transition()
              .duration(450)
              .style('fill-opacity',0)
              .style('stroke-opacity',0)

            svg_nodes
              .selectAll('.hill')
              .transition()
              .duration(450)
              .style('fill-opacity',1)
              .style('stroke-opacity',1)

            break;

          case 2 : // hills with halos

            svg_nodes
              .selectAll('path')
              .transition()
              .duration(450)
              .style('fill-opacity',0)
              .style('stroke-opacity',0)

            svg_nodes
              .selectAll('circle')
              .transition()
              .duration(450)
              .style('fill-opacity',1)
              .style('stroke-opacity',1)

            break;

          case 3 : // bicolor rings

            svg_nodes
              .selectAll('path')
              .style('fill-opacity',1)
              .style('stroke-opacity',1)

            svg_nodes
              .selectAll('circle')
              .transition()
              .duration(450)
              .style('fill-opacity',0)
              .style('stroke-opacity',0)

            break;
        }
      }
      else if (d3.event.key == " ") {
       svg_nodes.style('display','block')
     }
  })

})

function interpolateSpline(x) {
    let y;

    // The cubic spline interpolation has been calculated "heuristically" by using this service:
    // https://tools.timodenk.com/cubic-spline-interpolation

    // Inserted values are:
    // x, y
    // 0, 0
    // 0.1, 0.2
    // 0.55, 0.65
    // 0.8, 0.8
    // 1, 1

    if (x>=0 && x<=0.1) {
      y = (-8.7269*Math.pow(x,3)) + (1.1764*Math.pow(10,-60)*Math.pow(x,2)) + (2.0873*x) + (0);
    } else if (x>0.1 && x<=0.55) {
      y = (1.7416*Math.pow(x,3)) + (-3.1405*Math.pow(x,2)) + (2.4013*x) + (-1.0468*Math.pow(10,-2))
    } else if (x>0.55 && x<=0.8) {
      y = (2.2326*Math.pow(x,3)) + (-3.9507*Math.pow(x,2)) + (2.8469*x) + (-9.2166*Math.pow(10,-2))
    } else if (x>0.8 && x<=1) {
      y = (-2.3458*Math.pow(x,3)) + (7.0374*Math.pow(x,2)) + (-5.9436*x) + (2.2520)
    } else {
      y=x
    }

    return y
  }

function getCollections() {
  let collections = [
    {
      'n': 'Ultimo viene il corvo',
      'id': 'V002',
      'c': '#e9d05d'
    },
    {
      'n': 'L\'entrata in guerra',
      'id': 'V004',
      'c': '#12b259'
    },
    {
      'n': 'I racconti',
      'id': 'V006',
      'c': '#476a70'
    },
    {
      'n': 'Marcovaldo',
      'id': 'V011',
      'c': '#9f73b2'
    },
    {
      'n': 'Le cosmicomiche',
      'id': 'V013',
      'c': '#e89fc0'
    },
    {
      'n': 'Ti con zero',
      'id': 'V014',
      'c': '#581745'
    },
    {
      'n': 'La memoria del mondo',
      'id': 'V015',
      'c': '#00b1b3'
    },
    {
      'n': 'Gli amori difficili',
      'id': 'V017',
      'c': '#f0be96'
    },
    {
      'n': 'Palomar',
      'id': 'V022',
      'c': '#94d2ba'
    },
    {
      'n': 'Cosmicomiche vecchie e nuove',
      'id': 'V023',
      'c': '#f1634b'
    }
  ]

  return collections
}

function incrementDrawMode(drawMode)
{
  if(drawMode >= 3)
  {
    return 1;
  }
  else return drawMode + 1;
}
