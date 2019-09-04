
function draw_point(graphicsContainer, point, color, text_id, scaleFactor)
{
  const point_radius = 5;

  graphicsContainer.push({
    type : "circle",
    text_id : text_id,
    cx : point.x,
    cy : point.y,
    r : point_radius * scaleFactor,
    fill : color,
    stroke : color
  });
}

function draw_line(graphicsContainer, line, color, text_id, scaleFactor)
{
  const line_width = 3;

  graphicsContainer.push({
    type: "line",
    text_id : text_id,
    x1 : line.point1.x,
    y1 : line.point1.y,
    x2 : line.point2.x,
    y2 : line.point2.y,
    stroke : color,
    stroke_width : line_width * scaleFactor
  });
}

function draw_simple_arc(graphicsContainer, arc, color, text_id, scaleFactor)
{
  graphicsContainer.push({
    type : "arc",
    text_id : text_id,
    center : arc.center,
    innerRadius : arc.radius, // also radius here should be multiplied by scaleFactor
    outerRadius : arc.radius + arc.width * scaleFactor, // also radius here should be multiplied by scaleFactor
    startAngle : arc.startAngle,
    endAngle : arc.endAngle,
    fill : color,
    stroke : color
  });
}

function draw_arc(graphicsContainer, arc, color, text_id, scaleFactor)
{
  let epsilonAngle = 0.01
  if(arc.endAngle == arc.startAngle)
  {
    if(Math.abs(arc.startAngle - Math.PI / 2) > epsilonAngle)
    {
      let newArc = {
        center : arc.center,
        radius : arc.radius, // also radius here should be multiplied by scaleFactor
        width : arc.width * scaleFactor,
        startAngle : arc.startAngle,
        endAngle : arc.endAngle - epsilonAngle,
      };
      draw_arc(graphicsContainer, newArc, color, text_id, scaleFactor);
      return;
    }
    else
    {
      let newArc = {
        center : arc.center,
        radius : arc.radius, // also radius here should be multiplied by scaleFactor
        width : arc.width * scaleFactor,
        startAngle : 0,
        endAngle : Math.PI * 2,
      };
      draw_simple_arc(graphicsContainer, newArc, color, text_id, scaleFactor);
      return;
    }
  }

  if(arc.endAngle < arc.startAngle)
  {
    let arc1 = {
      center : arc.center,
      radius : arc.radius,
      width : arc.width,
      startAngle : arc.startAngle,
      endAngle : 2 * Math.PI,
    };
    draw_simple_arc(graphicsContainer, arc1, color, text_id, scaleFactor);

    let arc2 = {
      center : arc.center,
      radius : arc.radius,
      width : arc.width,
      startAngle : 0,
      endAngle : arc.endAngle,
    };
    draw_simple_arc(graphicsContainer, arc2, color, text_id, scaleFactor);

    return;
  }

  draw_simple_arc(graphicsContainer, arc, color, text_id, scaleFactor);
}

function draw_text(graphicsContainer, text_info, text_id, scaleFactor)
{
  let font_size = 15;
  let dx = .35;
  let dy = 1;

  graphicsContainer.push({
    type : "text",
    text_id : text_id,
    fill : text_info.textColor,
    font_size : font_size * scaleFactor + "px", //"15px",
    dy : dx * scaleFactor + "em", //".35em",
    dx : dy * scaleFactor + "em", //"1em",
    text_anchor : text_info.textAnchor,
    transform : "translate(" + (text_info.tx) + ", " + (text_info.ty) + ") rotate(" + (text_info.angle * 360 / (2 * Math.PI)) + ")",
    text : text_info.text
  });
}
