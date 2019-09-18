
function draw_point(graphicsContainer, point, color, text_id)
{
  const point_radius = 5;

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

function draw_line(graphicsContainer, line, color, text_id)
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
    stroke_width : line_width
  });
}

function draw_simple_arc(graphicsContainer, arc, color, text_id)
{
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

function draw_arc(graphicsContainer, arc, color, text_id)
{
  let epsilonAngle = 0.01;

  if(arc.endAngle == arc.startAngle)
  {
    if(Math.abs(arc.startAngle - Math.PI / 2) > epsilonAngle)
    {
      let newArc = {
        center : arc.center,
        radius : arc.radius,
        width : arc.width,
        startAngle : arc.startAngle,
        endAngle : arc.endAngle - epsilonAngle,
      };
      draw_arc(graphicsContainer, newArc, color, text_id);
      return;
    }
    else
    {
      let newArc = {
        center : arc.center,
        radius : arc.radius,
        width : arc.width,
        startAngle : 0,
        endAngle : Math.PI * 2,
      };
      draw_simple_arc(graphicsContainer, newArc, color, text_id);
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
    draw_simple_arc(graphicsContainer, arc1, color, text_id);

    let arc2 = {
      center : arc.center,
      radius : arc.radius,
      width : arc.width,
      startAngle : 0,
      endAngle : arc.endAngle,
    };
    draw_simple_arc(graphicsContainer, arc2, color, text_id);

    return;
  }

  draw_simple_arc(graphicsContainer, arc, color, text_id);
}

function split_text(text, threshold)
{
  let i = text.indexOf(" ", threshold);
  if(i >= 0)
  {
    let s1 = text.substring(0, i);
    let s2 = text.substring(i, text.length);
    return [s1.trim(), s2.trim()];
  }
  else return [text];
}

function draw_text(graphicsContainer, text_info, text_id)
{
  let caption_split_threshold = 19;

  graphicsContainer.push({
    type : "text",
    node_id : text_info.node_id,
    text_id : text_id,
    fill : text_info.textColor,
    font_size : "15px",
    dy : ".35em",
    dx : "1em",
    text_anchor : text_info.textAnchor,
    transform : "translate(" + (text_info.tx) + ", " + (text_info.ty) + ") rotate(" + (text_info.angle * 360 / (2 * Math.PI)) + ")",
    caption : text_info.caption,
    caption_segments : split_text(text_info.caption, caption_split_threshold).map(d => ({ text : d }))
  });
}
