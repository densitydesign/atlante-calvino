// https://observablehq.com/d/11b5d22090fd7c15@276
import define1 from "./a33468b95d0b15b0@692.js";

export default function define(runtime, observer) {
  const main = runtime.module();
  const fileAttachments = new Map([["Dataset Paura sul sentiero - Sheet1.tsv",new URL("./files/023c098d33cae36f10156cfd42363cd54904d4b590b02cd981cce9b44e665ff2f15e28436be93189aa091303f398e063273e99b8d8e4d9416533436fd59de878",import.meta.url)]]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], function(md){return(
md`# Wall of words`
)});
  main.variable(observer("data")).define("data", ["d3","FileAttachment"], async function(d3,FileAttachment){return(
d3.tsvParse(await FileAttachment("Dataset Paura sul sentiero - Sheet1.tsv").text(), (d)=>{

  d.width = d["Parole"].length;
  d.word = d["Parole"];
  d.type = d["Realtà-immaginazione"];
  d.concr = d["sostantivi concr-astr"];
  return d
})
)});
  const child1 = runtime.module(define1);
  main.import("legend", child1);
  main.variable(observer()).define(["md"], function(md){return(
md`### Colore corrisponde a colonna realtà-immaginazione`
)});
  main.variable(observer()).define(["legend","d3"], function(legend,d3){return(
legend({
  color: d3.scaleOrdinal()
  .domain(['riflessione-contesto', 'immaginazione', 'realtà'])
  .range(['#ffc33e','#00c97c','#4a4aff']),
  title: "Categories",
  tickSize: 0
})
)});
  main.variable(observer("chart")).define("chart", ["d3","data","color"], function(d3,data,color)
{
  const container = d3.create("div")
  .classed("box", true)
  .style("line-height", "30px")
  .style("font-size", "16px")
  .style("font-family", "sans-serif")
  ;
  
  const text = container.selectAll("text")
  .data(data)
  .enter()
  .append("text");
  
  const word = container.selectAll(".word").data(data)
  .enter()
  .append("div")
  .classed("word", true)
  .style("display", "inline-block")
  .style("width", d=>d.width+"1px")
  .style("height", "8px")
  .style("background-color", d=>color(d.type))
  .text("", d=>color(d.type))
  .style("margin-right", "3px")
  .text(function(d){ return d.word; })
  .style("font-style", "3px");
  
  return container.node();
  
}
);
  main.variable(observer()).define(["md"], function(md){return(
md`### Colore corrisponde a colonna concreto-astratto`
)});
  main.variable(observer()).define(["legend","d3"], function(legend,d3){return(
legend({
  color: d3.scaleOrdinal()
    .range(['#00c19c','#97dadd','#eee'])
  .domain(['concreto', 'astratto', 'none']),
  title: "Categories",
  tickSize: 0
})
)});
  main.variable(observer("chart2")).define("chart2", ["d3","data","color2","color"], function(d3,data,color2,color)
{
  const container = d3.create("div")
  .classed("box", true)
  .style("line-height", "30px")
  .style("font-size", "16px")
  .style("font-family", "sans-serif")
  ;
  
  const text = container.selectAll("text")
  .data(data)
  .enter()
  .append("text");
  
  const word = container.selectAll(".word").data(data)
  .enter()
  .append("div")
  .classed("word", true)
  .style("display", "inline-block")
  .style("width", d=>d.width+"1px")
  .style("height", "8px")
  .style("background-color", d=>color2(d.concr))
  .text("", d=>color(d.type))
  .style("margin-right", "3px")
  .text(function(d){ return d.word; })
  .style("font-style", "3px");
  
  return container.node();
  
}
);
  main.variable(observer("color")).define("color", ["d3"], function(d3){return(
d3.scaleOrdinal()
  .range(['#ffc33e','#00c97c','#4a4aff'])
  .domain(['riflessione-contesto', 'immaginazione', 'realtà'])
)});
  main.variable(observer("color2")).define("color2", ["d3"], function(d3){return(
d3.scaleOrdinal()
  .range(['#00c19c','#97dadd','#eee'])
  .domain(['concreto', 'astratto', ''])
)});
  main.variable(observer("d3")).define("d3", ["require"], function(require){return(
require("d3@5")
)});
  main.variable(observer("xdata")).define("xdata", ["d3"], function(d3)
{
  const data = Array.from(Array(2207),(d,i)=>({
  id:i, 
  width:d3.randomUniform(3,19)()
  }))
  return data;
        }
);
  return main;
}
