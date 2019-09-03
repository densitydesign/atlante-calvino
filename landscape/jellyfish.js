
function calculate_jellyfishes_offset(jellyfish1, jellyfish2)
{
  if(jellyfish1.children.length == 0 || jellyfish2.children.length == 0) return 0;

  let border_map1 = calculate_jellyfish_border_map(jellyfish1);
  let border_map2 = calculate_jellyfish_border_map(jellyfish2);

  let shared_levels = Math.min(border_map1.length, border_map2.length);

  let min_offset_found = 0;

  for(let i = 0; i < shared_levels; ++i)
  {
    let border1 = border_map1[i];
    let border2 = border_map2[i];

    min_offset_found = Math.max(min_offset_found, border1.right + Math.abs(border2.left));
  }

  return min_offset_found;
}

function calculate_width(hierarchy)
{
  if(hierarchy.children.length == 0) return 1;
  else
  {
    let children_total = 0;

    for(let i = 0; i < hierarchy.children.length; ++i)
    {
      children_total += calculate_width(hierarchy.children[i]);
    }

    return children_total;
  }
}

function calculate_continuous_extension(hierarchy)
{
  let direct_child_gap = 1;
  let hierarchy_gap = 1;

  if(hierarchy.children.length == 0) return 0;
  else if(hierarchy.children.every(d => d.children.length == 0)) return (hierarchy.children.length - direct_child_gap);
  else
  {
    let total = 0;

    for(let i = 0; i < hierarchy.children.length; ++i)
    {
      total += calculate_continuous_extension(hierarchy.children[i]);
    }

    total += hierarchy_gap * (hierarchy.children.length - 1);

    return total;
  }
}

function process_hierarchy(hierarchy, x, y)
{
  let jellyfish = {
    id : hierarchy.id,
    type : hierarchy.type,
    position : { x : x, y : y },
    children : []
  };

  switch(hierarchy.type)
  {
      case "generico_terrestre"     : jellyfish.color = "orange";   break;
      case "generico_non_terrestre" : jellyfish.color = "red";  break;
      case "nominato_terrestre"     : jellyfish.color = "dodgerblue"; break;
      case "nominato_non_terrestre" : jellyfish.color = "blue";  break;
      case "inventato"              : jellyfish.color = "fuchsia"; break;
      case "no_ambientazione"       : jellyfish.color = "darkgrey";  break;
  }

  let progressive_x = x;
  hierarchy.children.forEach(d => {
    jellyfish.children.push(process_hierarchy(d, progressive_x, y + 1))
    progressive_x = progressive_x + calculate_width(d);
  });

  return jellyfish;
}

function process_hierarchy_continuously(hierarchy, x, y)
{
  let jellyfish = {
    id : hierarchy.id,
    level : hierarchy.level,
    basal_type : hierarchy.basal_type,
    local_type : hierarchy.local_type,
    logical_position : { x : x, y : y },
    stripe_position : { x : 0, y : 0 },
    circle_position : { x : 0, y : 0 },
    children : []
  };

  switch(hierarchy.basal_type)
  {
      case "generico_terrestre"     : jellyfish.color = "orange";   break;
      case "generico_non_terrestre" : jellyfish.color = "red";  break;
      case "nominato_terrestre"     : jellyfish.color = "dodgerblue"; break;
      case "nominato_non_terrestre" : jellyfish.color = "blue";  break;
      case "inventato"              : jellyfish.color = "fuchsia"; break;
      case "no_ambientazione"       : jellyfish.color = "darkgrey";  break;
  }

  let hierarchy_gap = 1;
  let absolute_progressive_x = x;
  let relative_progressive_x = 0;

  for(let i = 0; i < hierarchy.children.length; ++i)
  {
    jellyfish.children.push(process_hierarchy_continuously(hierarchy.children[i], absolute_progressive_x, y + 1));

    let delta = 0;

    if(i < hierarchy.children.length - 1) delta += hierarchy_gap;

    delta += calculate_continuous_extension(hierarchy.children[i]);

    relative_progressive_x += delta;
    absolute_progressive_x += delta;
  }

  jellyfish.logical_position.x = x + relative_progressive_x / 2;

  return jellyfish;
}

function visit(hierarchy, status, processItem)
{
  processItem(hierarchy, status);

  hierarchy.children.forEach(d => visit(d, status, processItem));
}

function prepare_for_graphics(jellyfish)
{
  switch(jellyfish.basal_type)
  {
      case "generico_terrestre"     : jellyfish.color = "orange";   break;
      case "generico_non_terrestre" : jellyfish.color = "red";  break;
      case "nominato_terrestre"     : jellyfish.color = "dodgerblue"; break;
      case "nominato_non_terrestre" : jellyfish.color = "blue";  break;
      case "inventato"              : jellyfish.color = "fuchsia"; break;
      case "no_ambientazione"       : jellyfish.color = "darkgrey";  break;
  }

  jellyfish.stripe_position.x = jellyfish.logical_position.x * 20 + 10;
  jellyfish.stripe_position.y = jellyfish.logical_position.y * 20 + 10;

  jellyfish.children.forEach(d => prepare_for_graphics(d));
}

function draw_jellyfish_stripe(graphicsContainer, jellyfish, text_id)
{
  if(jellyfish.children.length > 0)
  {
    let target_point = { x : jellyfish.stripe_position.x, y : jellyfish.children[0].stripe_position.y };

    draw_line(
        graphicsContainer,
        {
            point1 : jellyfish.stripe_position,
            point2 : target_point
        },
        jellyfish.color);

    for(let i = 1; i < jellyfish.children.length; ++i)
    {
      draw_line(
          graphicsContainer,
          {
              point1 : jellyfish.children[i - 1].stripe_position,
              point2 : jellyfish.children[i].stripe_position
          },
          jellyfish.children[i - 1].color);
    }
  }

  draw_point(graphicsContainer, jellyfish.stripe_position, jellyfish.color, text_id);

  jellyfish.children.forEach(d => draw_jellyfish_stripe(graphicsContainer, d));
}

function prepare_jellyfish_data(hierarchy, center)
{
  let jellyfish = process_hierarchy_continuously(hierarchy, 0, 0);

  let status2 = { extremes : { min_x : 1000000, max_x : 0 } };

  visit(
    jellyfish,
    status2,
    d => {
      status2 = { extremes : {
        min_x : Math.min(status2.extremes.min_x, d.logical_position.x),
        max_x : Math.max(status2.extremes.max_x, d.logical_position.x) } };
    });

  var min_x_value2 = 0; //status2.extremes.min_x;
  var max_x_value2 = status2.extremes.max_x;

  prepare_for_graphics(jellyfish);

  let status = { extremes : { min_x : 1000000, max_x : 0 } };

  visit(
    jellyfish,
    status,
    d => {
      status = { extremes : {
        min_x : Math.min(status.extremes.min_x, d.stripe_position.x),
        max_x : Math.max(status.extremes.max_x, d.stripe_position.x) } };
    });

  var min_x_value = status.extremes.min_x;
  var max_x_value = status.extremes.max_x;
  var delta = max_x_value - min_x_value;

  var scalingCoefficient = max_x_value2 == 0 ? 1 : delta * (max_x_value2 + 1) / max_x_value2;

  visit(
    jellyfish,
    {},
    (d, status) => {
      d.angle = d.stripe_position.x / scalingCoefficient * 2 * Math.PI;
    });

  let radiusScaleFactor = 6;

  visit(
    jellyfish,
    {},
    (d, status) => {
      if(d.level == 0)
      {
        d.circle_position.x = center.x;
        d.circle_position.y = center.y;
        d.radius = 0;
        d.angle = 0;
      }
      if(d.level > 0)
      {
        d.angle = d.angle;
        d.radius = d.stripe_position.y * radiusScaleFactor;

        let x = Math.cos(d.angle) * d.radius + center.x;
        let y = Math.sin(d.angle) * d.radius + center.y;

        d.circle_position.x = x;
        d.circle_position.y = y;
      }
    });

  return jellyfish;
}

function draw_jellyfish_node(graphicsContainer, d, status, center, text_id)
{
  let inLeftEmicircle = Math.PI / 2 < d.angle && d.angle < 3 * Math.PI / 2;
  let textDistanceFactor = 1; //1.5;
  let textDistanceFactor2 = 1.15;
  let textDistance1 = 30;
  let textDistance2 = 0;

  let textColor;

  switch(d.local_type)
  {
      case "generico_terrestre"     : textColor = "orange";   break;
      case "generico_non_terrestre" : textColor = "red";  break;
      case "nominato_terrestre"     : textColor = "dodgerblue"; break;
      case "nominato_non_terrestre" : textColor = "blue";  break;
      case "inventato"              : textColor = "fuchsia"; break;
      case "no_ambientazione"       : textColor = "darkgrey";  break;
  }

  let text_info = {
    angle : inLeftEmicircle ? d.angle + Math.PI : d.angle,
    textColor : textColor,
    textAnchor : inLeftEmicircle ? "end" : "start",
    tx : center.x + (d.radius + (inLeftEmicircle ? textDistance1 : textDistance2)) * Math.cos(d.angle),
    ty : center.y + (d.radius + (inLeftEmicircle ? textDistance1 : textDistance2)) * Math.sin(d.angle),
    text : d.id
  };

  if(d.level > 0) draw_point(graphicsContainer, d.circle_position, textColor, text_id);

  if(d.level > 0) draw_text(graphicsContainer, text_info, text_id);

  if(d.children.length > 0)
  {
    let line_angle = d.children[0].angle + (d.children[d.children.length - 1].angle - d.children[0].angle) / 2;

    let start_point = {
      angle : line_angle,
      radius : d.radius + 10 * text_info.text.length
    };

    start_point.x = center.x + start_point.radius * Math.cos(start_point.angle);
    start_point.y = center.y + start_point.radius * Math.sin(start_point.angle);

    let target_point = {
      angle : line_angle,
      radius : d.children[0].radius
    };

    target_point.x = center.x + target_point.radius * Math.cos(target_point.angle);
    target_point.y = center.y + target_point.radius * Math.sin(target_point.angle);

    draw_line(
      graphicsContainer,
      {
          point1 : start_point,
          point2 : target_point
      },
      d.color,
      text_id);

    if(d.level == 0 || d.children.length > 1)
    {
      let arcWidth = 2;

      if(d.level == 0)
      {
        for(let i = 0; i < d.children.length; ++i)
        {
          let startAngle = calculate_startAngle(d.children, i);
          let endAngle = calculate_endAngle(d.children, i);

          let arc = {
            center : center,
            radius : d.children[0].radius,
            width : arcWidth,
            startAngle : startAngle,
            endAngle : endAngle
          };

//          draw_arc(graphicsContainer, arc, d.children[i].color, text_id);
        }
      }
      else
      {
        let arc = {
          center : center,
          radius : d.children[0].radius,
          width : arcWidth,
          startAngle : (d.children[0].angle + Math.PI / 2),
          endAngle : (d.children[d.children.length - 1].angle + Math.PI / 2)
        };

        draw_arc(graphicsContainer, arc, d.color, text_id);
      }
    }
  }
}

function draw_jellyfish(graphicsContainer, jellyfish, center, text_id)
{
  visit(
    jellyfish,
    {},
    (d, status) => draw_jellyfish_node(graphicsContainer, d, status, center, text_id));
}
