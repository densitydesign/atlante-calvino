
function draw_point(graphicsContainer, point, color, text_id)
{
  const point_radius = 5;
/*
  graphicsContainer
    .append("circle")
    .attr("cx", point.x)
    .attr("cy", point.y)
    .attr("r", point_radius)
    .attr("fill", color)
    .attr("stroke", color);
*/

  graphicsContainer.push({
    type : "circle",
    text_id : text_id,
    cx : point.x,
    cy : point.y,
    r : point_radius,
    fill : color,
    stroke : color
  });
}

function draw_line(graphicsContainer, line, color)
{
/*
  const line_width = 3;

  graphicsContainer
    .append("line")
    .attr("x1", line.point1.x)
    .attr("y1", line.point1.y)
    .attr("x2", line.point2.x)
    .attr("y2", line.point2.y)
    .attr("stroke", color)
    .attr("stroke-width", line_width);
  */
}

function draw_arc(graphicsContainer, arc, color, text_id)
{
/*
  const drawArc = d3
    .arc()
    .innerRadius(arc.radius)
    .outerRadius(arc.radius + arc.width)
    .startAngle(arc.startAngle)
    .endAngle(arc.endAngle);

  graphicsContainer
    .append("svg:path")
    .attr("fill", color)
    .attr("d", drawArc)
    .attr("transform", "translate(" + arc.center.x + ", " + arc.center.y + ")")
    .style("fill-opacity", 1)
    .style("stroke-opacity", 1);
*/

  graphicsContainer.push({
    type : "arc",
    text_id : text_id,
    center : arc.center,
    innerRadius : arc.radius,
    outerRadius : arc.radius + arc.width,
    startAngle : arc.startAngle,
    endAngle : arc.endAngle,
    fill : color,
    stroke : color
  });
}

function draw_text(graphicsContainer, text_info)
{
/*
  graphicsContainer
    .append("text")
    .style("fill", text_info.textColor)
    .style("font-size", "15px")
    .attr("dy", ".35em")
    .attr("dx", "1em")
    .style("text-anchor", text_info.textAnchor)
    .attr("transform", "translate(" + (text_info.tx) + ", " + (text_info.ty) + ") rotate(" + (text_info.angle * 360 / (2 * Math.PI)) + ")")
    .text(text_info.text);
*/
}
