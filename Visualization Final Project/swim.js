const margin = { top: 25, bottom: 50, left: 50, right: 30 },
  width = 420 - margin.left - margin.right,
  height = 300 - margin.top - margin.bottom;

//Variables, used for dropdown menus
const distance = ['100m', '1500m', '200m', '400m', '50m', '800m', '4x100m', '4x200m']
const stroke = ['Freestyle','Breaststroke','Backstroke','Butterfly','Medley']
const olympic_event = [['50m Freestyle', '100m Freestyle'], ['200m Freestyle', '400m Freestyle'], ['800m Freestyle', '1500m Freestyle'], ['100m Backstroke', '200m Backstroke'], ['100m Butterfly', '200m Butterfly'], ['100m Breaststroke', '200m Breaststroke'], ['400m Breaststroke', '200m Medley'], ['400m Medley', '4x100m Freestyle Relay'], ['4x200m Freestyle Relay', '4x100m Medley Relay']]
let current_event = '100m Freestyle' // Default as it's the only event for both men and women to be at every game since 1912
let event_gender = 'Men' // Default gender
let current_year = 1912 // Default year

/**Data:
 * olympic_swimming: Original, cleaned dataset
 * olympic_swimming2: Primary dataset, where time is converted to seconds and location also features the year to denote the Olympic Game name
**/
d3.csv("data/unique_events_per_year.csv").then(function(data){ // For slider and radio button
d3.csv("data/olympic_swimming_one_event.csv").then(function(results){ //olympic_swimming2, but with all the events merged into 1 for ease of use
d3.csv("data/olympic_swimming_mds_clusters2.csv").then(function(mds){ //For MDS, with clusters (1 is variance by stroke, 2 is variance by year, we will be using latter)
d3.csv("data/olympic_swimming_pca_year.csv").then(function(pca){ //For PCA/Biplot
  d3.csv("data/olympic_swimming_pca_vectors.csv").then(function(vector){ //For PCA/Biplot Vectors
d3.csv("data/top5_medal_count.csv").then(function(medals){ //For medal bar chart
  // Important variables and creating svgs------------------------------------------------------------------------------------------------
  data_array = [] // for ease of use since just calling data itself is a pain
  for (let a = 0; a < data.length; a++){
    data_array.push([data[a].Year, data[a].Gender,JSON.parse(data[a].Distance)])
  }
  const table = d3.select("#table") //table to select events
      .append("table")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  const swim_scatter = d3.select("#swim-scatter") //Plotting every top 8 result
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  const swim_bar = d3.select("#swim-bar") //Countries with the most medal wins in swimming
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  const swim_mds = d3.select("#swim-mds") //which event contributed to the most variance in performance over time
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  const swim_pca = d3.select("#swim-pca") //Cluster years that had similar trends in improvement, in order to find which years had faster improvement than others, as well as identify outliers
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  //Table--------------------------------------------------------------------------------------------------------------------------------
  //events are the table elements
  table.append('text').attr('text-anchor','middle')
  table.append('br')
  table.append("thead")
      .append("tr")
      .append("th")
      .attr("colspan", 2)
      .text("Olympic Swimming Events");
        
  // Table body
  const tbody = table.append("tbody");
        
  // Rows
  const rows = tbody.selectAll("tr")
      .data(olympic_event)
      .enter()
      .append("tr");
        
  //populate data
  const matching = data_array.find(item => 
    parseInt(item[0]) === current_year && item[1] === event_gender
  );
  const check = matching ? matching[2] : [];
  function getOpacity(value){ 
    return check.includes(value) ? 1 : 0.5;
  }
  function handleClick(d) {
    if (check.includes(d)){
      current_event = d
      updateScatter()
      updatePCA()
      updateColor()
    }
  }
  rows.append("td")
    .text(d => d[0])
    .style('opacity', d => getOpacity(d[0]))
    .style('cursor', d => getOpacity(d[0]) === 1 ? 'pointer' : 'default')
    .on('click', (_,d) => handleClick(d[0]))
    .style('background-color',d => { return d[0] === current_event ? 'black' : null  })
    .style('color',d => { return d[0] === current_event ? 'white' : null  })
  rows.append("td")
    .text(d => d[1])
    .style('opacity', d => getOpacity(d[1]))
    .style('cursor', d => getOpacity(d[1]) === 1 ? 'pointer' : 'default')
    .on('click', (_,d) => handleClick(d[1]))
    .style('background-color',d => { return d[1] === current_event ? 'black' : null  })
    .style('color',d => { return d[1] === current_event ? 'white' : null  })
  //Slider for Year
  const slider = table.append('div').style("margin-top", "20px").style("width", width+150 + "px")
  slider.append('label').text(current_year).attr("id", "year").attr('text-align','center')
  slider.append('br');
  slider.append('input').attr("type", "range").attr("min", 1912).attr("max", 2020).attr("step", 4).attr("value", current_year).attr('text-align','center')
  .on("input", function() {
    current_year = +this.value;
    d3.select("#year").text(current_year)
    updateBar()
    updateMDS()
    updateTable()
  })
  //Radio Button for Gender
  table.append("input")
    .attr("type", "radio")
    .attr("name", "options")
    .attr('id', "male_button")
    .attr('checked', 'checked')
  table.append("label").attr('for', "male_button").text('Men');
  table.append("input")
    .attr("type", "radio")
    .attr("name", "options")
    .attr('id', "female_button")
  table.append("label").attr('for', "female_button").text('Women');
  d3.select('#male_button').on('change', function(){
    if (this.checked){
      event_gender = 'Men'
      updateScatter()
      updateTable()
    }
  })
  d3.select('#female_button').on('change', function(){
    if (this.checked){
      event_gender = 'Women'
      updateScatter()
      updateTable()
    }
  })
  //Name
  table.append('br')
  table.append('br')
  table.append('h3')
    .attr('text-anchor','middle')
    .attr('x',width/2)
    .attr('y',-10)
    .text('Conway Zhou')
  table.append('h3')
    .attr('text-anchor','middle')
    .attr('x',width/2)
    .attr('y',-10)
    .text('Spring 2025 CSE 564 Visualization')
  table.append('h3')
    .attr('text-anchor','middle')
    .attr('x',width/2)
    .attr('y',-10)
    .text('May 13, 2025')
  table.append('a')
    .attr('href', '../projects.html')
    .attr('text-anchor','middle')
    .attr('x',width/2)
    .attr('y',-10)
    .text('Back to Projects')

  //Scatterplot--------------------------------------------------------------------------------------------------------------------------
  let domain_max = math.ceil(d3.max(results, function(d){
    if (d.Distance === current_event & d.Gender === event_gender){
      return +d.Results
    }
    return null;
  }))
  let domain_min = math.floor(d3.min(results, function(d){
    if (d.Distance === current_event & d.Gender === event_gender){
      return +d.Results
    }
    return null;
  }))
  let x = d3.scaleLinear()
    .domain([1912, 2020])
    .range([ 0, width ]);
  let x_no_tick = d3.axisBottom(x).tickFormat(d3.format("d"));
  swim_scatter.append("g")
    .attr("transform", "translate(0," + height + ")")
    .attr("class", "x axis")
    .call(x_no_tick)

  // Add Y axis
  let y = d3.scaleLinear()
    .domain([domain_min, domain_max])
    .range([ height, 0]);
  swim_scatter.append("g")
    .attr("class", "y axis")
    .call(d3.axisLeft(y));

  // Axis names and Title
  swim_scatter.append("text")
    .attr('class', 'x label')
    .attr('text-anchor', 'end')
    .attr('x', width)
    .attr('y', height + 35)
    .text("Year");
  swim_scatter.append('text')
    .attr('class', 'y label')
    .attr('transform', 'rotate(-90)')
    .attr('text-anchor', 'end')
    .attr('x', 0)
    .attr('y', -30)
    .text("Time (sec)");
  swim_scatter.append('text')
    .attr("class", "scatter-title")
    .attr('text-anchor','middle')
    .attr('x',width/2)
    .attr('y',-10)
    .text(`Every time for ${event_gender} ${current_event} at the Olympics`);
  //tooltips
  const tooltip = d3.select("#swim-scatter")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("background-color", "black")
    .style("color", "white")
    .style("border-radius", "5px")
    .style("padding", "10px")
    .style("position", "absolute")
  
  const mouseover = function(_,d) {
    const [x_coordinate, y_coordinate] = [x(d.Year),y(d.Results)]
    let medal = "No Medal";
    if (d.Rank === '1') medal = "Gold";
    else if (d.Rank === '2') medal = "Silver";
    else if (d.Rank === '3') medal = "Bronze";

    tooltip
      .html(`${d.Year} Olympics<br>${d.Athlete} (${d.Team})<br>${d.Results} seconds, ${medal}`)
      .style("left", (x_coordinate + margin.left + 10) + "px")
      .style("top", (y_coordinate + margin.top) + "px")
      .transition()
      .duration(100)
      .style("opacity", 1)
  }
  const mousemove = function(_, d) {
    const [x_coordinate, y_coordinate] = [x(d.Year),y(d.Results)]
    tooltip
      .style("left", (x_coordinate + margin.left + 10) + "px")
      .style("top", (y_coordinate + margin.top) + "px")
  }
  const mouseleave = function(_,_) {
    tooltip
      .transition()
      .duration(100)
      .style("opacity", 0)
      .on("end", function() {
        d3.select(this).style("left", "-9999px");
    })
  }

  swim_scatter.append('g')
    .selectAll("circle")
    .data(results.filter(function(d){ return d.Distance === current_event & d.Gender === event_gender }))
    .enter()
    .append("circle")
      .attr("cx", function(d) { return x(d.Year); })
      .attr("cy", function(d) { return y(d.Results); })
      .attr("r", 7)
      .style("fill", d => {
        if (d.Rank === '1') return "#FFD700"; // Gold
        if (d.Rank === '2') return "#C0C0C0"; // Silver
        if (d.Rank === '3') return "#CD7F32"; // Bronze
        return "#FFFFFF" // Everything else
      })
    .style("opacity", 0.7)
    .on("mouseover", mouseover)
    .on("mousemove", mousemove)
    .on("mouseleave", mouseleave);
  // Legend
  const legend = swim_scatter.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${width/2 + 170}, 0)`);

  const colors = [
    { label: "Gold (1st)", color: "#FFD700" },
    { label: "Silver (2nd)", color: "#C0C0C0" },
    { label: "Bronze (3rd)", color: "#CD7F32" }
  ];

  legend.selectAll("legend-items")
    .data(colors)
    .enter()
    .append("g")
    .attr("class", "legend-item")
    .attr("transform", (_, i) => `translate(0, ${i * 20})`)
    .on("click", function(_, d) {
      const medalColor = d3.color(d.color).toString();// clicked color
      const selected = swim_scatter.selectAll("circle") //select circles that match
        .filter(function() {
          const nodeColor = d3.color(d3.select(this).style("fill"));
          return nodeColor ? nodeColor.toString() === medalColor : false;
        });
      const isHighlighted = selected.size() > 0 && selected.nodes()[0].classList.contains("highlighted")
      if (isHighlighted) { //Revert
        selected.classed("highlighted", false);
        swim_scatter.selectAll("circle").style("display", "block");
      }else{ // Bold highlighted, dim unhighlighted
        selected.classed("highlighted", true);
        swim_scatter.selectAll("circle").filter(function() {
          return d3.select(this).style("fill").toUpperCase() !== medalColor.toUpperCase();
        }).style("display", "none");
      }
    });
  legend.selectAll(".legend-item")
    .append("circle")
    .attr("r", 6)
    .attr("cx", 10)
    .attr("cy", 10)
    .style("fill", d => d.color)
    .style("opacity", 0.7)

  legend.selectAll(".legend-item")
    .append("text")
    .attr("x", 25)
    .attr("y", 15)
    .text(d => d.label)
    .style("font-size", "14px")
    .style("text-anchor", "start");


  //Bar Chart-------------------------------------------------------------------------------------------------------------------
  let current_year_data = medals.filter(d => parseInt(d.Year) === current_year)
  teams = current_year_data.map(d => d.Team)
  medal_count = current_year_data.map(d => parseInt(d.Rank))
  // X and Y axis
  const x_bar = d3.scaleBand()
    .range([ 0, width ])
    .domain(teams)
    .padding(0.2);
  swim_bar.append("g")
    .attr("class", "x axis")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x_bar))
    .selectAll("text")
      .attr("transform", "translate(-10,0)rotate(-45)")
      .style("text-anchor", "end");
  const y_bar = d3.scaleLinear()
      .domain([0, d3.max(medal_count)])
      .range([ height, 0]);
  swim_bar.append("g")
      .attr("class", "y axis")
      .call(d3.axisLeft(y_bar));
    
  // Axis names and Title
  swim_bar.append("text")
    .attr('class', 'x label')
    .attr('text-anchor', 'end')
    .attr('x', width)
    .attr('y', height + 35)
    .text("Team");
  swim_bar.append('text')
    .attr('class', 'y label')
    .attr('transform', 'rotate(-90)')
    .attr('text-anchor', 'end')
    .attr('x', 0)
    .attr('y', -30)
    .text("Medal Count");
  swim_bar.append('text')
    .attr("class", "chart-title")
    .attr('text-anchor','middle')
    .attr('x',width/2)
    .attr('y',-10)
    .text(`Medal Count for Summer ${current_year} Olympics`);
  //tooltip
  const tooltip_bar = d3.select("#swim-bar")
  .append("div")
  .style("opacity", 0)
  .attr("class", "tooltip")
  .style("background-color", "black")
  .style("color", "white")
  .style("border-radius", "5px")
  .style("padding", "10px")
  .style("position", "absolute")
  const mouseover_bar = function(_,d) {
    console.log(x_bar(d.Team) + x_bar.bandwidth()/2,y_bar(parseInt(d.Rank)))
    const x_coordinate = x_bar(d.Team) + x_bar.bandwidth()/2
    const y_coordinate = y_bar(parseInt(d.Rank))
    tooltip_bar 
      .html(`Medals: ${d.Rank}`)
      .style("left", (x_coordinate + margin.left ) + "px")
      .style("top", (y_coordinate + margin.top - 50) + "px")
      .transition()
      .duration(100)
      .style("opacity", 1)
  }
  const mousemove_bar = function(_, d) {
    const x_coordinate = x_bar(d.Team) + x_bar.bandwidth()/2
    const y_coordinate = y_bar(parseInt(d.Rank))
    tooltip_bar 
      .style("left", (x_coordinate + margin.left ) + "px")
      .style("top", (y_coordinate + margin.top - 50) + "px")
  }
  const mouseleave_bar = function(_,_) {
    tooltip_bar 
      .transition()
      .duration(100)
      .style("opacity", 0)
      .on("end", function() {
        d3.select(this).style("left", "-9999px"); 
    })
  }
  // Bars
  swim_bar.selectAll("mybar")
  .data(current_year_data)
  .enter()
  .append("rect")
    .attr("x", d => x_bar(d.Team))
    .attr("y", d => y_bar(parseInt(d.Rank)))
    .attr("width", x_bar.bandwidth())
    .attr("height", d => height - y_bar(parseInt(d.Rank)))
    .attr("fill", "#364958")
    .on("mouseover", mouseover_bar)
    .on("mousemove", mousemove_bar)
    .on("mouseleave", mouseleave_bar);
  //MDS-----------------------------------------------------------------------------------------------------------------------------
  const x_coordinates = mds.map(row => parseFloat(row[0])) //x coordinates extracted from coordinates
  const y_coordinates = mds.map(row => parseFloat(row[1])) //x coordinates extracted from coordinates
  let x_mds_data = d3.scaleLinear().domain([Math.floor(d3.min(x_coordinates)), Math.ceil(d3.max(x_coordinates))]).range([0,width])
  let y_mds_data = d3.scaleLinear().domain([Math.floor(d3.min(y_coordinates)), Math.ceil(d3.max(y_coordinates))]).range([height,0])
  swim_mds.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x_mds_data))
  swim_mds.append("g")
    .call(d3.axisLeft(y_mds_data))
  
  swim_mds.append("text")
    .attr('class', 'x label')
    .attr('text-anchor', 'end')
    .attr('x', width)
    .attr('y', height + 30)
    .text("x");
  swim_mds.append('text')
    .attr('class', 'y label')
    .attr('transform', 'rotate(-90)')
    .attr('text-anchor', 'end')
    .attr('x', 0)
    .attr('y', -30)
    .text("y");

  let color_mds = d3.scaleOrdinal()
    .domain(["0", "1"])
    .range([ "red", "orange"])
  swim_mds.append('g')
    .selectAll("dot")
    .data(mds)
    .join("circle")
        .attr("cx", function (d) { return x_mds_data(d[0]); } )
        .attr("cy", function (d) { return y_mds_data(d[1]); } )
        .attr("r", 7)
        .style("fill", function (d) { return color_mds(d['IDs']) })
        .style("opacity", 0.7)
        .style("stroke", function (d) { 
          if (parseInt(d['Year']) === current_year){ return 'black'}})
        .style("stroke-width", function (d) { 
          if (parseInt(d['Year']) === current_year){ return 2}})
  swim_mds.append('text')
  .attr('text-anchor','middle')
  .attr('x',width/2)
  .attr('y',-10)
  .text("Olympic Improvement Trends by Year");

  // Add legend
  const legend_mds = swim_mds.append("g")
  .attr("class", "legend")
    .attr("transform", `translate(${width - 50}, 20)`); 

  // Items
  legend_mds.selectAll(".legend-item")
    .data(color_mds.domain())
    .enter()
    .append("g")
    .attr("class", "legend-item")
    .attr("transform", (_, i) => `translate(0, ${i * 20 + 20})`); 

  // Colors
  legend_mds.selectAll(".legend-item").append("circle")
    .attr("cx", 30)
    .attr("cy", -10)
    .attr("r", 5)
    .style("fill", color_mds)
    .style("stroke", "black")
    .style("stroke-width", 1);

  // Text for legend
  legend_mds.append("text")
    .attr("x", 20)
    .attr("y", -5)
    .text("Clusters");
  legend_mds.selectAll(".legend-item").append("text")
    .attr("x", 40)
    .attr("y", -5)
    .style("font-size", "14px")
    .text(d => {
      switch(d) {
        case "0": return "ID: 0";
        case "1": return "ID: 1";
        default: ;
      }
    })
  //PCA---------------------------------------------------------------------------------------------------------------------
  const pc1 = pca.map(d => parseFloat(d.PC1))
  const pc2 = pca.map(d => parseFloat(d.PC2))
  const pc_name = pca.map((d) => ({year: d.Year, x: parseFloat(d.PC1), y: parseFloat(d.PC2)}))
  let x_bi = d3.scaleLinear().domain([Math.floor(d3.min(pc1)), Math.ceil(d3.max(pc1))]).range([0,width])      
  let y_bi = d3.scaleLinear().domain([Math.floor(d3.min(pc2)), Math.ceil(d3.max(pc2))]).range([height,0])
  const vectors = vector.map((d) => ({event: d.Event, x: d.x, y: d.y})); // too lazy to rename
  
  //biplot lines
  value1 = width/2 - 13 // used for x1 in line and y axis position
  value2 = height/2 + 29 // used for y1 in line and x axis position
  swim_pca.selectAll("line")
      .data(vectors)
      .enter()
      .append("line")
      .attr("x1", value1)
      .attr("y1", value2)
      .attr("x2", d => x_bi(d.x)) 
      .attr("y2", d => y_bi(d.y)) 
      .attr("stroke", "grey")
      .attr("stroke-width", function(d){
        return d.event === current_event ? 1 : 0.1
      })
      .attr("opacity", function(d){
        return d.event === current_event ? 1 : 0.1
      })
  swim_pca.selectAll("text") // name of points
      .data(pc_name)
      .enter()
      .append("text")
      .attr("x", d => {
        return d.x < 0 ? x_bi(d.x)-20 : x_bi(d.x)+20
      })
      .attr("y", d => y_bi(d.y)+5)
      .text(d => d.year)
      .attr("fill", "black")
      .attr("text-anchor", "middle")
      .style("opacity",0)
           
  // axes
  let pca_x_axis = swim_pca.append("g")
      .attr("transform", "translate(0," + (value2) + ")")
      .call(d3.axisBottom(x_bi));
  let pca_y_axis = swim_pca.append("g")
  .attr("transform", "translate(" + (value1) + ",0)")
      .call(d3.axisLeft(y_bi));
  // Axis names and Title
  pca_x_name = swim_pca.append("text")
    .attr('class', 'x label')
    .attr('text-anchor', 'end')
    .attr('x', width+5)
    .attr('y', height-50)
    .text("PCA 1");
  pca_y_name = swim_pca.append('text')
    .attr('class', 'y label')
    .attr('transform', 'rotate(-90)')
    .attr('text-anchor', 'end')
    .attr('x', 5)
    .attr('y', height/2 + 20)
    .text("PCA 2");
  swim_pca.append('text')
    .attr('text-anchor','middle')
    .attr('x',width/2)
    .attr('y',-10)
    .text(`Variance For Every Event`);
  // scatterplot for years
  swim_pca.selectAll("dot")
      .data(pc_name)
      .enter()
      .append("circle")
      .attr("cx", d => x_bi(d.x))
      .attr("cy", d => y_bi(d.y))
      .attr("r", 7)
      .attr("fill", "#B2FFA8")
      .attr("opacity", 0.7)
      .attr('class','year')
      .on('mouseover',function(){
        swim_pca.selectAll("text")
        .filter((_, i) => i === pc_name.indexOf(d3.select(this).datum()))
        .style("opacity", 1)
        swim_pca.selectAll("circle.year")
        .filter((_, i) => i != pc_name.indexOf(d3.select(this).datum()))
        .style("opacity", 0.2)

        pca_x_axis.style('opacity',0.2)
        pca_y_axis.style('opacity',0.2)
        pca_x_name.style('opacity',0.2)
        pca_y_name.style('opacity',0.2)
      })
      .on('mouseout',function(){
        swim_pca.selectAll("text")
        .filter((d, i) => i === pc_name.indexOf(d3.select(this).datum()))
        .style("opacity", 0)
        swim_pca.selectAll("circle.year")
        .filter((_, i) => i != pc_name.indexOf(d3.select(this).datum()))
        .style("opacity", 0.7)

        pca_x_axis.style('opacity',1)
        pca_y_axis.style('opacity',1)
        pca_x_name.style('opacity',1)
        pca_y_name.style('opacity',1)
      })
  //scatterplot for the vector points (event)
  swim_pca.selectAll("dot")
      .data(vectors)
      .enter()
      .append("circle")
      .attr("cx", d => x_bi(d.x))
      .attr("cy", d => y_bi(d.y))
      .attr("r", 7)
      .attr("fill", "#F4ACB7")
      .attr('class','event')
      .attr("opacity", function(d){
        return d.event === current_event ? 1 : 0.2
      })
      .attr("stroke", function(d){
        return d.event === current_event ? 'black' : null
      })

    // Add legend
    let color_pca = d3.scaleOrdinal()
    .domain(["0", "1"])
    .range([ "#F4ACB7", "#B2FFA8"])
    
    const legend_pca = swim_pca.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${width/2 + 170}, 0)`);

    // Items
    legend_pca.selectAll(".legend-item")
      .data(color_pca.domain())
      .enter()
      .append("g")
      .attr("class", "legend-item")
      .attr("transform", (_, i) => `translate(0, ${i * 20 + 20})`); 

    // Colors
    legend_pca.selectAll(".legend-item").append("circle")
      .attr("cx", 30)
      .attr("cy", 150)
      .attr("r", 5)
      .style("fill", color_pca)
      .style("opacity", 0.7)

    // Text for legend
    legend_pca.selectAll(".legend-item").append("text")
      .attr("x", 40)
      .attr("y", 155)
      .style("font-size", "14px")
      .text(d => {
        switch(d) {
          case "0": return "Event";
          case "1": return "Year";
          default: ;
        }
      })



  //updating stuff
  function updateTable(){ //updates table-------------------------------------------------------------------------------------
    const matching = data_array.find(item => 
      parseInt(item[0]) === current_year && item[1] === event_gender
    );
    const check = matching ? matching[2] : [];
    function getOpacity(value){ 
      return check.includes(value) ? 1 : 0.5;
    }
    function handleClick(d) {
    if (check.includes(d)){
      current_event = d
      updateScatter()
      updatePCA()
      updateColor()
    }
  }
    rows.selectAll("td:nth-child(1)")
      .text(d => d[0])
      .style('opacity', d => getOpacity(d[0]))
      .style('cursor', d => getOpacity(d[0]) === 1 ? 'pointer' : 'default')
      .on('click', (_,d) => handleClick(d[0]))
      .style('background-color',d => { return d[0] === current_event ? 'black' : null  })
      .style('color',d => { return d[0] === current_event ? 'white' : null  })
    rows.selectAll("td:nth-child(2)")
      .text(d => d[1])
      .style('opacity', d => getOpacity(d[1]))
      .style('cursor', d => getOpacity(d[1]) === 1 ? 'pointer' : 'default')
      .on('click', (_,d) => handleClick(d[1]))
      .style('background-color',d => { return d[1] === current_event ? 'black' : null  })
      .style('color',d => { return d[1] === current_event ? 'white' : null  })
  }
  function updateColor(){ // update color on table
    rows.selectAll("td:nth-child(1)")
      .style('background-color',d => { return d[0] === current_event ? 'black' : null  })
      .style('color',d => { return d[0] === current_event ? 'white' : null  })
    rows.selectAll("td:nth-child(2)")
      .style('background-color',d => { return d[1] === current_event ? 'black' : null  })
      .style('color',d => { return d[1] === current_event ? 'white' : null  })

  }
  function updateScatter(){ // updates scatterplot----------------------------------------------------------------------------
    legend.selectAll(".legend-item").remove()
    swim_scatter.selectAll("circle").remove()
    let domain_max = math.ceil(d3.max(results, function(d){
      if (d.Distance === current_event & d.Gender === event_gender){
        return +d.Results
      }
      return null;
    }))
    let domain_min = math.floor(d3.min(results, function(d){
      if (d.Distance === current_event & d.Gender === event_gender){
        return +d.Results
      }
      return null;
    }))
    // update y axis
    let y = d3.scaleLinear()
      .domain([domain_min, domain_max])
      .range([ height, 0]);
    swim_scatter.select(".y.axis")
      .transition()
      .duration(750)
      .call(d3.axisLeft(y));
    // update title
    swim_scatter.select(".scatter-title")
      .text(`Every time for ${event_gender} ${current_event} at the Olympics`);
    // new mouseover
    const mouseover = function(_,d) {
      let medal = "No Medal";
      if (d.Rank === '1') medal = "Gold";
      else if (d.Rank === '2') medal = "Silver";
      else if (d.Rank === '3') medal = "Bronze";

      tooltip
        .html(`${d.Year} Olympics<br>${d.Athlete} (${d.Team})<br>${d.Results} seconds, ${medal}`)
        .style("left", (x(d.Year) + margin.left + 10) + "px")
        .style("top", (y(d.Results) + margin.top) + "px")
        .transition()
        .duration(100)
        .style("opacity", 1)
    }
    const mousemove = function(_, d) {
      tooltip
        .style("left", (x(d.Year) + margin.left + 10) + "px")
        .style("top", (y(d.Results) + margin.top) + "px")
    }
    const mouseleave = function(_,_) {
      tooltip
        .transition()
        .duration(100)
        .style("opacity", 0)
        .on("end", function() {
          d3.select(this).style("left", "-9999px");
      })
    }
    //update points
    const dots = swim_scatter.selectAll("circle").data(results.filter(function(d){ return d.Distance === current_event & d.Gender === event_gender }))
    dots
      .exit()
      .transition()
      .duration(750)
      .attr("r", 0)
      .remove()
    dots
      .on("mouseover", null)
      .on("mousemove", null)
      .on("mouseleave", null)
      .transition()
      .duration(750)
      .attr("cx", d => x(d.Year))
      .attr("cy", d => y(d.Results))
      .attr("fill", d => { 
        if (d.Rank === '1') return "#FFD700";
        if (d.Rank === '2') return "#C0C0C0";
        if (d.Rank === '3') return "#CD7F32";
        return "#FFFFFF";
    })
      .on("end", function() {
        d3.select(this)
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave)
    });
    dots
      .enter()
      .append("circle")
        .attr("cx", d => x(d.Year))
        .attr("cy", height)
        .attr("r", 0)
        .style('opacity',0.7)
        .attr("fill", d => {
            if (d.Rank === '1') return "#FFD700";
            if (d.Rank === '2') return "#C0C0C0";
            if (d.Rank === '3') return "#CD7F32";
            return "#FFFFFF";
        })
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave)
      .transition()
        .duration(750)
        .attr("cy", d => y(d.Results))
        .attr("r", 7); 
    const colors = [
      { label: "Gold (1st)", color: "#FFD700" },
      { label: "Silver (2nd)", color: "#C0C0C0" },
      { label: "Bronze (3rd)", color: "#CD7F32" }
      ];

    legend.selectAll("legend-items")
      .data(colors)
      .enter()
      .append("g")
      .attr("class", "legend-item")
      .attr("transform", (_, i) => `translate(0, ${i * 20})`)
      .on("click", function(_, d) {
        const medalColor = d3.color(d.color).toString();// clicked color
        const selected = swim_scatter.selectAll("circle") //select circles that match
          .filter(function() {
            const nodeColor = d3.color(d3.select(this).style("fill"));
            return nodeColor ? nodeColor.toString() === medalColor : false;
          });
        const isHighlighted = selected.size() > 0 && selected.nodes()[0].classList.contains("highlighted")
        if (isHighlighted) { //Revert
          selected.classed("highlighted", false);
          swim_scatter.selectAll("circle").style("display", "block");
        }else{ // Bold highlighted, dim unhighlighted
          selected.classed("highlighted", true);
          swim_scatter.selectAll("circle").filter(function() {
            return d3.select(this).style("fill").toUpperCase() !== medalColor.toUpperCase();
          }).style("display", "none");
        }
      });

      legend.selectAll(".legend-item")
        .append("circle")
        .attr("r", 6)
        .attr("cx", 10)
        .attr("cy", 10)
        .style("fill", d => d.color)
        .style("opacity", 0.7)
      legend.selectAll(".legend-item")
        .append("text")
        .attr("x", 25)
        .attr("y", 15)
        .text(d => d.label)
        .style("font-size", "14px")
        .style("text-anchor", "start");
  }
  function updateBar(){ //updates bar chart-----------------------------------------------------------------------------------
    let current_year_data = medals.filter(d => parseInt(d.Year) === current_year)
    teams = current_year_data.map(d => d.Team)
    medal_count = current_year_data.map(d => parseInt(d.Rank))
    // update X and Y axis
    const x_bar = d3.scaleBand()
      .range([ 0, width ])
      .domain(teams)
      .padding(0.2);
    const y_bar = d3.scaleLinear()
        .domain([0, d3.max(medal_count)])
        .range([ height, 0]);
    swim_bar.select('.x.axis')
      .transition()
      .duration(750)
      .call(d3.axisBottom(x_bar))
      .selectAll("text")
      .attr("transform", "translate(-10,0)rotate(-45)")
      .style("text-anchor", "end");
    swim_bar.select(".y.axis")
        .transition()
        .duration(750)
        .call(d3.axisLeft(y_bar));
    
    // Update chart title
    swim_bar.select('.chart-title').text(`Medal Count for Summer ${current_year} Olympics`);
    
    // New Mouseovers
    const mouseover_bar = function(_,d) {
      console.log(x_bar(d.Team) + x_bar.bandwidth()/2,y_bar(parseInt(d.Rank)))
      tooltip_bar 
        .style("left", (x_bar(d.Team) + x_bar.bandwidth()/2 + margin.left) + "px")
        .style("top", (y_bar(parseInt(d.Rank)) + margin.top - 50) + "px")
    }
    const mousemove_bar = function(_, d) {
      tooltip_bar
        .html(`Medals: ${d.Rank}`) 
        .style("left", (x_bar(d.Team) + x_bar.bandwidth()/2 + margin.left) + "px")
        .style("top", (y_bar(parseInt(d.Rank)) + margin.top - 50) + "px")
        .style("opacity", 1);
    }
    const mouseleave_bar = function(_,_) {
      d3.select(this).attr("fill", "#364958")
      tooltip_bar 
        .transition()
        .duration(100)
        .style("opacity", 0)
        .on("end", function() {
          d3.select(this).style("left", "-9999px"); 
      })
    }
    // Update Bars
    const bars = swim_bar.selectAll("rect").data(current_year_data, d => d.Team)
    bars
      .exit()
      .transition()
      .duration(750)
      .attr("y", height)
      .attr("height", 0)
      .remove()
    bars
      .on("mouseover", null)
      .on("mousemove", null)
      .on("mouseleave", null)
      .transition()
      .duration(750)
      .attr("x", d => x_bar(d.Team))
      .attr("width", x_bar.bandwidth())
      .attr("y", d => y_bar(parseInt(d.Rank)))
      .attr("height", d => height - y_bar(parseInt(d.Rank)))
      .on("end", function() {
        d3.select(this)
            .on("mouseover", mouseover_bar)
            .on("mousemove", mousemove_bar)
            .on("mouseleave", mouseleave_bar);
    });
    bars
      .enter()
      .append("rect")
        .attr("x", d => x_bar(d.Team))
        .attr("width", x_bar.bandwidth())
        .attr("y", height)
        .attr("height", 0)
        .attr("fill", "#364958")
        .on("mouseover", mouseover_bar)
        .on("mousemove", mousemove_bar)
        .on("mouseleave", mouseleave_bar)
      .transition()
        .duration(750)
        .attr("y", d => y_bar(parseInt(d.Rank)))
        .attr("height", d => height - y_bar(parseInt(d.Rank)))       
  }
  function updateMDS(){ // update MDS------------------------------------------------------------------------------------------------
    swim_mds.selectAll("circle")
        .style("stroke", function (d) { 
          if (parseInt(d['Year']) === current_year){ return 'black'}})
        .style("stroke-width", function (d) { 
          if (parseInt(d['Year']) === current_year){ return 2}})
  }
  function updatePCA(){ // update PCA------------------------------------------------------------------------------------------------
    swim_pca.selectAll("line")
    .data(vectors)
      .attr("stroke-width", function(d){
          return d.event === current_event ? 1 : 0.1
        })
      .attr("opacity", function(d){
        return d.event === current_event ? 1 : 0.1
      })
    swim_pca.selectAll("circle.event")
      .attr("opacity", function(d){
        return d.event === current_event ? 1 : 0.1
      })
      .attr("stroke", function(d){
        return d.event === current_event ? 'black' : null
      })
  }
      
})})})})})})