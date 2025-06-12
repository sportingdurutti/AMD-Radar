// The MIT License (MIT)

// Copyright (c) 2017-2024 Zalando SE

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.


function radar_visualization(config) {

  config.svg_id = config.svg || "radar";
  config.width = config.width || 1450;
  config.height = config.height || 1000;
  config.colors = ("colors" in config) ? config.colors : {
      background: "#fff",
      grid: '#dddde0',
      inactive: "#ddd"
    };
  config.print_layout = ("print_layout" in config) ? config.print_layout : true;
  config.links_in_new_tabs = ("links_in_new_tabs" in config) ? config.links_in_new_tabs : true;
  config.repo_url = config.repo_url || '#';
  config.print_ring_descriptions_table = ("print_ring_descriptions_table" in config) ? config.print_ring_descriptions_table : false;

  const legendShift = (config.legend_column_width || 140) - 140;
  config.legend_offset = config.legend_offset || [
    { x: 450-(legendShift*0.5), y: 90 -(legendShift*0.8)},
    { x: -675-(legendShift*2), y: 90 -(legendShift*0.8)},
    { x: -675-(legendShift*2), y: -310 -(legendShift*0.2)},
    { x: 450-(legendShift*0.5), y: -310 - (legendShift*0.2)}
  ]
  config.title_offset = config.title_offset || { x: -675-(legendShift*1.5), y: -420 };
  config.footer_offset = config.footer_offset || { x: -155, y: 450 };
  config.legend_column_width = config.legend_column_width || 140
  config.legend_line_height = config.legend_line_height || 10

  // custom random number generator, to make random sequence reproducible
  // source: https://stackoverflow.com/questions/521295
  var seed = 42;
  function random() {
    var x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }

  function random_between(min, max) {
    return min + random() * (max - min);
  }

  function normal_between(min, max) {
    return min + (random() + random()) * 0.5 * (max - min);
  }

  // radial_min / radial_max are multiples of PI
  const quadrants = [
    { radial_min: 0, radial_max: 0.5, factor_x: 1, factor_y: 1 },
    { radial_min: 0.5, radial_max: 1, factor_x: -1, factor_y: 1 },
    { radial_min: -1, radial_max: -0.5, factor_x: -1, factor_y: -1 },
    { radial_min: -0.5, radial_max: 0, factor_x: 1, factor_y: -1 }
  ];

  const rings = [
    { radius: 130 },
    { radius: 220 },
    { radius: 310 },
    { radius: 400 }
  ];

  function polar(cartesian) {
    var x = cartesian.x;
    var y = cartesian.y;
    return {
      t: Math.atan2(y, x),
      r: Math.sqrt(x * x + y * y)
    }
  }

  function cartesian(polar) {
    return {
      x: polar.r * Math.cos(polar.t),
      y: polar.r * Math.sin(polar.t)
    }
  }

  function bounded_interval(value, min, max) {
    var low = Math.min(min, max);
    var high = Math.max(min, max);
    return Math.min(Math.max(value, low), high);
  }

  function bounded_ring(polar, r_min, r_max) {
    return {
      t: polar.t,
      r: bounded_interval(polar.r, r_min, r_max)
    }
  }

  function bounded_box(point, min, max) {
    return {
      x: bounded_interval(point.x, min.x, max.x),
      y: bounded_interval(point.y, min.y, max.y)
    }
  }

  function segment(quadrant, ring) {
    var polar_min = {
      t: quadrants[quadrant].radial_min * Math.PI,
      r: ring === 0 ? 30 : rings[ring - 1].radius
    };
    var polar_max = {
      t: quadrants[quadrant].radial_max * Math.PI,
      r: rings[ring].radius
    };
    var cartesian_min = {
      x: 15 * quadrants[quadrant].factor_x,
      y: 15 * quadrants[quadrant].factor_y
    };
    var cartesian_max = {
      x: rings[3].radius * quadrants[quadrant].factor_x,
      y: rings[3].radius * quadrants[quadrant].factor_y
    };
    return {
      clipx: function(d) {
        var c = bounded_box(d, cartesian_min, cartesian_max);
        var p = bounded_ring(polar(c), polar_min.r + 15, polar_max.r - 15);
        d.x = cartesian(p).x; // adjust data too!
        return d.x;
      },
      clipy: function(d) {
        var c = bounded_box(d, cartesian_min, cartesian_max);
        var p = bounded_ring(polar(c), polar_min.r + 15, polar_max.r - 15);
        d.y = cartesian(p).y; // adjust data too!
        return d.y;
      },
      random: function() {
        return cartesian({
          t: random_between(polar_min.t, polar_max.t),
          r: normal_between(polar_min.r, polar_max.r)
        });
      }
    }
  }

  // position each entry randomly in its segment
  for (var i = 0; i < config.entries.length; i++) {
    var entry = config.entries[i];
    entry.segment = segment(entry.quadrant, entry.ring);
    var point = entry.segment.random();
    entry.x = point.x;
    entry.y = point.y;
    entry.color = entry.active || config.print_layout ?
      config.rings[entry.ring].color : config.colors.inactive;
  }

  // partition entries according to segments
  var segmented = new Array(4);
  for (let quadrant = 0; quadrant < 4; quadrant++) {
    segmented[quadrant] = new Array(4);
    for (var ring = 0; ring < 4; ring++) {
      segmented[quadrant][ring] = [];
    }
  }
  for (var i=0; i<config.entries.length; i++) {
    var entry = config.entries[i];
    segmented[entry.quadrant][entry.ring].push(entry);
  }

  // assign unique sequential id to each entry
  var id = 1;
  for (quadrant of [2,3,1,0]) {
    for (var ring = 0; ring < 4; ring++) {
      var entries = segmented[quadrant][ring];
      entries.sort(function(a,b) { return a.label.localeCompare(b.label); })
      for (var i=0; i<entries.length; i++) {
        entries[i].id = "" + id++;
      }
    }
  }

  function translate(x, y) {
    return "translate(" + x + "," + y + ")";
  }

  function viewbox1(quadrant) {
    // alert(Math.max(-100, quadrants[quadrant].factor_x * 700) - 620)
    // alert(Math.max(200, quadrants[quadrant].factor_y * 600) - 620)
    return [
      Math.max(-100, quadrants[quadrant].factor_x * 700) - 620,
      Math.max(200, quadrants[quadrant].factor_y * 600) - 620,
      580,
      580
    ].join(" ");
  }

  function viewbox(quadrant) {
  switch (quadrant) {
    case 2: // Top-Left (PLATAFORMAS)
      return [0, 0, 600, 600].join(" ");
    case 1: // Bottom-Left (LINGUAGENS)
      return [0, 350, 600, 600].join(" ");
    case 3: // Top-Right (FERRAMENTAS)
      return [920, 0, 600, 600].join(" ");
    case 0: // Bottom-Right (TÉCNICAS)
      return [920, 350, 600, 600].join(" ");
  }
}


  // adjust with config.scale.
  config.scale = config.scale || 1;
  var scaled_width = config.width * config.scale;
  var scaled_height = config.height * config.scale;

  var svg = d3.select("svg#" + config.svg_id)
    .style("background-color", config.colors.background)
    .attr("width", scaled_width)
    .attr("height", scaled_height);

  const verticalOffset = -40; // negative means up
  var radar = svg.append("g");
    // Store global state for reuse
  if ("zoomed_quadrant" in config)
  {
      window.selectedZoomedQuadrant = config.zoomed_quadrant;
  } 
  else
  {
      window.selectedZoomedQuadrant = -1;
  } 
  
  if ("zoomed_quadrant" in config && config.zoomed_quadrant > 10) 
    {
      svg.attr("viewBox", viewbox(config.zoomed_quadrant));
    } 
    else 
    {
      radar.attr("transform", translate((scaled_width / 2),( scaled_height / 2) + verticalOffset).concat(`scale(${config.scale})`));
    }

  const radarShift = (config.legend_column_width || 140) - 140;

  var radarContent = radar.append("g")
  .attr("transform", `translate(${-(legendShift / 2)}, 0)`);

  //var grid = radar.append("g");
  var grid = radarContent.append("g");

  // define default font-family
  config.font_family = config.font_family || "Arial, Helvetica";

  // draw grid lines
  grid.append("line")
    .attr("x1", 0).attr("y1", -400)
    .attr("x2", 0).attr("y2", 400)
    .style("stroke", config.colors.grid)
    .style("stroke-width", 1);
  grid.append("line")
    .attr("x1", -400).attr("y1", 0)
    .attr("x2", 400).attr("y2", 0)
    .style("stroke", config.colors.grid)
    .style("stroke-width", 1);

  // background color. Usage `.attr("filter", "url(#solid)")`
  // SOURCE: https://stackoverflow.com/a/31013492/2609980
  var defs = grid.append("defs");
  var filter = defs.append("filter")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 1)
    .attr("height", 1)
    .attr("id", "solid");
  filter.append("feFlood")
    .attr("flood-color", "rgb(0, 0, 0, 0.8)");
  filter.append("feComposite")
    .attr("in", "SourceGraphic");

  // draw rings
  for (var i = 0; i < rings.length; i++) {
    grid.append("circle")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", rings[i].radius)
      .style("fill", "none")
      .style("stroke", config.colors.grid)
      .style("stroke-width", 1);
    if (config.print_layout) {
      grid.append("text")
        .text(config.rings[i].name)
        .attr("y", -rings[i].radius + 62)
        .attr("text-anchor", "middle")
        .style("fill", config.rings[i].color)
        .style("opacity", 0.35)
        .style("font-family", config.font_family)
        .style("font-size", "42px")
        .style("font-weight", "bold")
        .style("pointer-events", "none")
        .style("user-select", "none");
    }
  }

  function legend_transform(quadrant, ring, legendColumnWidth, index=null, previousHeight = null) {
    const dx = ring < 2 ? 0 : legendColumnWidth;
    let dy = (index == null ? -16 : index * config.legend_line_height);

    if (ring % 2 === 1) {
      dy = dy + 16 + previousHeight;
    }

    return translate(
      config.legend_offset[quadrant].x + dx,
      config.legend_offset[quadrant].y + dy - 5
    );
  }

  // draw title and legend (only in print layout)
  if (config.print_layout) {
    // title
    radar.append("a")
      .attr("href", config.repo_url)
      .attr("transform", translate(config.title_offset.x, config.title_offset.y))
      .append("text")
      .attr("class", "hover-underline")  // add class for hover effect
      .text(config.title)
      .style("font-family", config.font_family)
      .style("font-size", "20")
      .style("font-weight", "bold")
      .style("font-family", "FlamaCondensed-Basic")
      //.style("fill", "rgb(185, 177, 166)")
      .style("fill-opacity", 1)
      .style("text-transform", "uppercase")
      .style("font-weight", 400)
      .style("letter-spacing", "1px")
      .attr("transform", `translate(${-(legendShift / 2)}, 0)`);


    // date
    radar
      .append("text")
      .attr("transform", translate(config.title_offset.x, config.title_offset.y + 20))
      .text(config.date || "")
      .style("font-family", config.font_family)
      .style("font-size", "14")
      .style("fill", "#999")

    // footer
    radar.append("text")
      .attr("transform", translate(config.footer_offset.x, config.footer_offset.y))
      .text("▲ moved up     ▼ moved down     ★ new     ⬤ no change")
      .attr("xml:space", "preserve")
      .style("font-family", config.font_family)
      .style("font-size", "12px");

    // legend
    const legend = radar.append("g");
    for (let quadrant = 0; quadrant < 4; quadrant++) {
      legend.append("text")
        .attr("transform", translate(
          config.legend_offset[quadrant].x ,
          config.legend_offset[quadrant].y - 45
        ))
        .text(config.quadrants[quadrant].name)
        .style("font-family", config.font_family)
        .style("font-family", "FlamaCondensed-Basic")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .style("cursor", "pointer")
        .style("fill", "rgb(185, 177, 166)")
        .style("fill", "rgb(64, 64, 64)")
        .style("fill-opacity", 1)
        .style("text-transform", "uppercase")
        .style("font-weight", 400)
        .style("letter-spacing", "1px")
        .on("click", () => onQuadrantClick(quadrant));
        //.on("click", function () 
        //{
          //if (config.zoomed_quadrant > -1)
          //{ 
            // svg.attr("viewBox", null);
            // radar.attr("transform", translate((scaled_width / 2), (scaled_height / 2) - 50).concat(`scale(${config.scale})`));
            // config.zoomed_quadrant = -1;
            // window.selectedZoomedQuadrant = -1;
          //}
          //else
          //{ 
            // svg.attr("viewBox", viewbox(quadrant));
            // radar.attr("transform", null); // Remove transform to let viewBox take control
            //config.zoomed_quadrant  = quadrant;
            //window.selectedZoomedQuadrant = quadrant;
          //}
        //});
      let previousLegendHeight = 0
      for (let ring = 0; ring < 4; ring++) {
        if (ring % 2 === 0) {
          previousLegendHeight = 0
        }
        legend.append("text")
          .attr("transform", legend_transform(quadrant, ring, config.legend_column_width, null, previousLegendHeight))
          .text(config.rings[ring].name)
          .style("font-family", config.font_family)
          .style("font-size", "14px")
          .style("font-weight", "bold")
          .style("fill", config.rings[ring].color);
        legend.selectAll(".legend" + quadrant + ring)
          .data(segmented[quadrant][ring])
          .enter()
            .append("a")
              .attr("href", function (d, i) {
                 return d.link ? d.link : "#"; // stay on same page if no link was provided
              })
              // Add a target if (and only if) there is a link and we want new tabs
              .attr("target", function (d, i) {
                 return (d.link && config.links_in_new_tabs) ? "_blank" : null;
              })
            .append("text")
              .attr("transform", function(d, i) { return legend_transform(quadrant, ring, config.legend_column_width, i, previousLegendHeight); })
              .attr("class", "legend" + quadrant + ring)
              .attr("id", function(d, i) { return "legendItem" + d.id; })
              .text(function(d) { return d.id + ". " + d.label; })
              .style("font-family", config.font_family)
              .style("font-size", "11px")
              .on("mouseover", function(event, d) { showBubble(d); highlightLegendItem(d); })
              .on("click", function(event, d) { showpanel(d)})
              .on("mouseout", function(event, d) { hideBubble(d); unhighlightLegendItem(d); })
              .call(wrap_text)
              .each(function() {
                previousLegendHeight += d3.select(this).node().getBBox().height;
              });
      }
    }
  }

  function wrap_text(text) {
    let heightForNextElement = 0;

    text.each(function() {
      const textElement = d3.select(this);
      const words = textElement.text().split(" ");
      let line = [];

      // Use '|' at the end of the string so that spaces are not trimmed during rendering.
      const number = `${textElement.text().split(".")[0]}. |`;
      const legendNumberText = textElement.append("tspan").text(number);
      const legendBar = textElement.append("tspan").text('|');
      const numberWidth = legendNumberText.node().getComputedTextLength() - legendBar.node().getComputedTextLength();

      textElement.text(null);

      let tspan = textElement
          .append("tspan")
          .attr("x", 0)
          .attr("y", heightForNextElement)
          .attr("dy", 0);

      for (let position = 0; position < words.length; position++) {
        line.push(words[position]);
        tspan.text(line.join(" "));

        // Avoid wrap for first line (position !== 1) to not end up in a situation where the long text without
        // whitespace is wrapped (causing the first line near the legend number to be blank).
        if (tspan.node().getComputedTextLength() > config.legend_column_width && position !== 1) {
          line.pop();
          tspan.text(line.join(" "));
          line = [words[position]];

          tspan = textElement.append("tspan")
              .attr("x", numberWidth)
              .attr("dy", config.legend_line_height)
              .text(words[position]);
        }
      }
      const textBoundingBox = textElement.node().getBBox();
      heightForNextElement = textBoundingBox.y + textBoundingBox.height;
    });
  }

  // layer for entries
  //var rink = radar.append("g")
  var rink = radarContent.append("g")
    .attr("id", "rink");

  // rollover bubble (on top of everything else)
  //var bubble = radar.append("g")
  var bubble = radarContent.append("g")
    .attr("id", "bubble")
    .attr("x", 0)
    .attr("y", 0)
    .style("opacity", 0)
    .style("pointer-events", "none")
    .style("user-select", "none");
  bubble.append("rect")
    .attr("rx", 4)
    .attr("ry", 4)
    .style("fill", "#333");
  bubble.append("text")
    .style("font-family", config.font_family)
    .style("font-size", "10px")
    .style("fill", "#fff");
  bubble.append("path")
    .attr("d", "M 0,0 10,0 5,8 z")
    .style("fill", "#333");

  function showBubble(d) 
  {
    if (d.active || config.print_layout) 
    {
       var tooltip = d3.select("#bubble text")
      .text(d.label);

      var bbox = tooltip.node().getBBox();

      d3.select("#bubble")
        .attr("transform", translate(d.x - bbox.width / 2, d.y - 16))
        .style("opacity", 0.8)
        .transition()
        .duration(100)
        .attr("transform", translate(d.x - bbox.width / 2, d.y - 16) + " scale(1.2)"); // ✅ Scale full group

      d3.select("#bubble rect")
        .attr("x", -5)
        .attr("y", -bbox.height)
        .attr("width", bbox.width + 10)
        .attr("height", bbox.height + 4);

      d3.select("#bubble path")
        .attr("transform", translate(bbox.width / 2 - 5, 3));
    }
  }

  function hideBubble(d) {
    var bubble = d3.select("#bubble")
      .attr("transform", translate(0,0))
      .style("opacity", 0);
  }


  function highlightLegendItem(d) {
    var legendItem = document.getElementById("legendItem" + d.id);
    legendItem.setAttribute("filter", "url(#solid)");
    legendItem.setAttribute("fill", "white");

    legendItem.style.fontSize = "13px";
    legendItem.style.transition = "font-size 0.2s ease";

    const blip = d3.selectAll(".blip").filter(function(b) 
    {
      return b.id === d.id;
    });
    
    blip.selectAll("circle,path")
      .transition()
      .duration(100)
      .attr("transform", "scale(2.0)")
      .on("end", function() {
      d3.select(this)
        .classed("pulse", true)
        .classed("blip-glow", true);
    });

    blip.select("text")
      .transition()
      .duration(100)
      .attr("transform", "scale(2.0)");

    legendItem.setAttribute("id", "legendItem" + d.id);
    legendItem.style.cursor = "pointer";
    legendItem.onclick = function () 
    {
        openModal(`<div class="modal-title">${d.label}</div><div class="modal-description">${d.description}</div>`);
    };      
  }

  function unhighlightLegendItem(d) 
  {
    var legendItem = document.getElementById("legendItem" + d.id);
    legendItem.removeAttribute("filter");
    legendItem.removeAttribute("fill");
    legendItem.style.fontSize = "11px";
    const blip = d3.selectAll(".blip").filter(function(b) 
    {
      return b.id === d.id;
    });

    blip.selectAll("circle,path")
      .transition()
      .duration(200)
      .attr("transform", "scale(1)")
      .on("end", function() {
        d3.select(this)
        .classed("pulse", false)
        .classed("blip-glow", false);
    });

    blip.select("text")
      .transition()
      .duration(200)
      .attr("transform", "scale(1)");
  }

  // draw blips on radar
  var blips = rink.selectAll(".blip")
    .data(config.entries)
    .enter()
      .append("g")
        .attr("class", "blip")
        .attr("transform", function(d, i) { return legend_transform(d.quadrant, d.ring, config.legend_column_width, i); })
        .on("mouseover", function(event, d) { showBubble(d); highlightLegendItem(d);})
        .on("click", function(event, d) { showpanel(d)})
        .on("mouseout", function(event, d) { hideBubble(d); unhighlightLegendItem(d);});

  // configure each blip
  blips.each(function(d) {
    var blip = d3.select(this);

    // blip link
    if (d.active && Object.prototype.hasOwnProperty.call(d, "link") && d.link) {
      blip = blip.append("a")
        .attr("xlink:href", d.link);

      if (config.links_in_new_tabs) {
        blip.attr("target", "_blank");
      }
    }

    // blip shape
    if (d.moved == 1) 
    {
        //blip.append("path")
        const triangle = blip.append("path")
          .attr("d", "M -11,5 11,5 0,-13 z") // triangle pointing up
          .style("fill", d.color)
          .attr("transform", "scale(1)");
        blip.on("mouseover.enlarge", function () 
        {
          triangle
            .transition()
              .duration(100)
              .attr("transform", "scale(2.0)")
              .transition()
              .duration(200)
              .attr("transform", "scale(1.6)")
              .transition()
              .duration(200)
              .attr("transform", "scale(2.0)");         
        })
        blip.on("mouseout.shrink", function () 
        {
          triangle
            .interrupt()
            .transition()
            .duration(100)
            .attr("transform", "scale(1)")
        })
    } 
    else if (d.moved == -1) 
    {
      const triangle = blip.append("path")
        .attr("d", "M -11,-5 11,-5 0,13 z") // triangle pointing down
        .style("fill", d.color)
        .attr("transform", "scale(1)");
        blip.on("mouseover.enlarge", function () 
        {
          triangle
            .transition()
              .duration(100)
              .attr("transform", "scale(2.0)")
              .transition()
              .duration(200)
              .attr("transform", "scale(1.6)")
              .transition()
              .duration(200)
              .attr("transform", "scale(2.0)");         
        })
        blip.on("mouseout.shrink", function () 
        {
          triangle
            .interrupt()
            .transition()
            .duration(100)
            .attr("transform", "scale(1)")
        })
    } 
    else if (d.moved == 2) 
    {
      //blip.append("path")
      const triangle = blip.append("path")
        .attr("d", d3.symbol().type(d3.symbolStar).size(200))
        .style("fill", d.color)
        .attr("transform", "scale(1)");
        blip.on("mouseover.enlarge", function () 
        {
          triangle
            .transition()
              .duration(100)
              .attr("transform", "scale(2.0)")
              .transition()
              .duration(200)
              .attr("transform", "scale(1.6)")
              .transition()
              .duration(200)
              .attr("transform", "scale(2.0)");        
        })
        blip.on("mouseout.shrink", function () 
        {
          triangle
            .interrupt()
            .transition()
            .duration(100)
            .attr("transform", "scale(1)")
        })
    } 
    else 
    {
      const circle = blip.append("circle")
      //blip.append("circle")
        .attr("r", 9)
        .attr("fill", d.color)
        .style("transition", "all 0.1s ease");
      blip.on("mouseover.enlarge", function () 
      {
        circle
          .transition()
          .duration(200)
          .attr("r", 18)
          .transition()
          .duration(200)
          .attr("r", 14)
          .transition()
          .duration(200)
          .attr("r", 18);
           blip.classed("blip-glow", true);      
      })
      blip.on("mouseout.shrink", function () 
      {
        circle.transition()
          .duration(100)
          .attr("r", 9)
          blip.classed("blip-glow", false);
      })
    }

      blip.on("click", function () {
        openModal(`<div class="modal-title">${d.label}</div><div class="modal-description">${d.description}</div>`);
      });

    // blip text
    if (d.active || config.print_layout) {
      var blip_text = config.print_layout ? d.id : d.label.match(/[a-z]/i);
      const label = blip.append("text")
      //blip.append("text")
        .text(blip_text)
        .attr("y", 3)
        .attr("text-anchor", "middle")
        .style("fill", "#fff")
        .style("font-family", config.font_family)
        .style("font-size", function(d) { return blip_text.length > 2 ? "8px" : "9px"; })
        .style("pointer-events", "none")
        .style("user-select", "none")
        .attr("transform", "scale(1)");

        // Animate label on hover
      blip
        .on("mouseover.textgrow", function () {
          label
            .transition()
            .duration(100)
            .attr("transform", "scale(2.0)")
            .classed("pulse", true).classed("blip-glow", true);
        })
        .on("mouseout.textshrink", function () {
          label
            .transition()
            .duration(100)
            .attr("transform", "scale(1)")
            .classed("pulse", true).classed("blip-glow", false);
        }); 
      }
  });

  // make sure that blips stay inside their segment
  function ticked() {
    blips.attr("transform", function(d) {
      return translate(d.segment.clipx(d), d.segment.clipy(d));
    })
  }

  // distribute blips, while avoiding collisions
  d3.forceSimulation()
    .nodes(config.entries)
    .velocityDecay(0.19) // magic number (found by experimentation)
    .force("collision", d3.forceCollide().radius(12).strength(0.85))
    .on("tick", ticked);

  function ringDescriptionsTable() {
    var table = d3.select("body").append("table")
      .attr("class", "radar-table")
      .style("border-collapse", "collapse")
      .style("position", "relative")
      .style("top", "-70px")  // Adjust this value to move the table closer vertically
      .style("margin-left", "50px")
      .style("margin-right", "50px")
      .style("font-family", config.font_family)
      .style("font-size", "13px")
      .style("text-align", "left");

    var thead = table.append("thead");
    var tbody = table.append("tbody");

    // define fixed width for each column
    var columnWidth = `${100 / config.rings.length}%`;

    // create table header row with ring names
    var headerRow = thead.append("tr")
      .style("border", "1px solid #ddd");

    headerRow.selectAll("th")
      .data(config.rings)
      .enter()
      .append("th")
      .style("padding", "8px")
      .style("border", "1px solid #ddd")
      .style("background-color", d => d.color)
      .style("color", "#fff")
      .style("width", columnWidth)
      .text(d => d.name);

    // create table body row with descriptions
    var descriptionRow = tbody.append("tr")
      .style("border", "1px solid #ddd");

    descriptionRow.selectAll("td")
      .data(config.rings)
      .enter()
      .append("td")
      .style("padding", "8px")
      .style("border", "1px solid #ddd")
      .style("width", columnWidth)
      .text(d => d.description);
  }

  if (config.print_ring_descriptions_table) {
    ringDescriptionsTable();
  }


function onQuadrantClick(quadrant) {
  const svgElement = d3.select("svg");
  const radarGroup = d3.select("g#radar"); // adjust this if radar group has a different ID or selector

  const currentViewBox = svgElement.attr("viewBox")
    ? svgElement.attr("viewBox").split(" ").map(Number)
    : [0, 0, config.width, config.height];

  const fullViewBox = [0, 0, config.width, config.height];
  const easeCubicInOut = d3.easeCubicInOut || ((t) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  // Zooming out (same quadrant clicked again)
  if (config.zoomed_quadrant === quadrant) {
    config.zoomed_quadrant = -1;
    window.selectedZoomedQuadrant = -1;
    animateViewBox(svgElement, currentViewBox, fullViewBox, 1000, easeCubicInOut);
  }

  // Zooming from one quadrant to another
  else if (config.zoomed_quadrant !== -1) {
    animateViewBox(svgElement, currentViewBox, fullViewBox, 1000, easeCubicInOut, () => {
      config.zoomed_quadrant = quadrant;
      window.selectedZoomedQuadrant = quadrant;
      const targetViewBox = viewbox(quadrant).split(" ").map(Number);
      animateViewBox(svgElement, fullViewBox, targetViewBox, 1000, easeCubicInOut);
    });
  }

  // First zoom-in
  else {
    config.zoomed_quadrant = quadrant;
    window.selectedZoomedQuadrant = quadrant;
    const targetViewBox = viewbox(quadrant).split(" ").map(Number);
    animateViewBox(svgElement, currentViewBox, targetViewBox, 1000, easeCubicInOut);
  }
}

window.onQuadrantClick = onQuadrantClick


function animateViewBox(svgElement, start, end, duration = 1000, easing = d3.easeCubicInOut, onEnd) {
  const interpolate = d3.interpolateArray(start, end);
  const startTime = performance.now();

  function animate() {
    const now = performance.now();
    const t = Math.min(1, (now - startTime) / duration);
    const easedT = easing(t);
    const interpolated = interpolate(easedT);

    svgElement.attr("viewBox", interpolated.join(" "));

    if (t < 1) {
      requestAnimationFrame(animate);
    } else if (typeof onEnd === "function") {
      onEnd();
    }
  }

  animate();
}

}


