d3.csv("data.csv").then(function(data) {
  // Chuẩn hóa dữ liệu 
  const parseTime = d3.timeParse("%Y-%m-%d %H:%M:%S");
  data.forEach(d => {
    d.Thang = parseTime(d["Thời gian tạo đơn"]).getMonth() + 1;
  });

  // Tổng số đơn hàng theo tháng 
  const donhang_thang = d3.rollups(
    data,
    v => new Set(v.map(d => d["Mã đơn hàng"])).size,
    d => d.Thang
  );

  // --- B3: Đơn hàng theo Nhóm hàng + Tháng ---
  const donhang_nhom_thang = d3.rollups(
    data,
    v => new Set(v.map(d => d["Mã đơn hàng"])).size,
    d => d.Thang,
    d => d["Mã nhóm hàng"],
    d => d["Tên nhóm hàng"]
  );

  // Gộp dữ liệu vào mảng merged 
  const merged = [];
  donhang_nhom_thang.forEach(([thang, groups]) => {
    const tong = donhang_thang.find(d => d[0] === thang)[1];
    groups.forEach(([maNhom, tenGroups]) => {
      tenGroups.forEach(([tenNhom, soDH]) => {
        merged.push({
          Thang: thang,
          Nhom: maNhom,
          Ten: tenNhom,
          HienThi: `[${maNhom}] ${tenNhom}`,
          XacSuat: soDH / tong
        });
      });
    });
  });

  // Gom dữ liệu theo nhóm 
  const nested = d3.groups(merged, d => d.HienThi);

  // Thiết lập SVG 
  const svg = d3.select("#Chart8"),
        margin = {top: 40, right: 150, bottom: 50, left: 80},
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom;

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear()
              .domain([1, 12])
              .range([0, width]);

  const y = d3.scaleLinear()
              .domain([0, d3.max(merged, d => d.XacSuat)])
              .nice()
              .range([height, 0]);

  //  🎨 Màu theo nhóm 
  const customColors = {
    "BOT": "#4CAF50",
    "SET": "#2196F3",
    "THO": "#FFC107",
    "TTC": "#E91E63",
    "TMX": "#9C27B0"
  };

  const color = d3.scaleOrdinal()
                  .domain(Object.keys(customColors))
                  .range(Object.values(customColors));

  // Trục X 
  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(12).tickFormat(d => "T" + String(d).padStart(2, "0")));

  // Trục Y 
  g.append("g")
    .call(d3.axisLeft(y).tickFormat(d3.format(".0%")));

  // Vẽ các đường biểu diễn 
  nested.forEach(([key, values]) => {
    values = values.sort((a, b) => a.Thang - b.Thang);

    g.append("path")
      .datum(values)
      .attr("fill", "none")
      .attr("stroke", () => {
        const maNhom = key.match(/\[(.*?)\]/)?.[1]; // Lấy mã nhóm
        return color(maNhom) || "#999";
      })
      .attr("stroke-width", 2)
      .attr("d", d3.line()
        .x(d => x(d.Thang))
        .y(d => y(d.XacSuat)));

    //  Chấm tròn tại mỗi Tháng
    g.selectAll(".dot-" + key)
      .data(values)
      .enter().append("circle")
        .attr("cx", d => x(d.Thang))
        .attr("cy", d => y(d.XacSuat))
        .attr("r", 3)
        .attr("fill", () => {
          const maNhom = key.match(/\[(.*?)\]/)?.[1];
          return color(maNhom) || "#999";
        })
        .append("title")
        .text(d => `${key} - T${d.Thang}: ${(d.XacSuat * 100).toFixed(1)}%`);
  });

  // Tiêu đề
  svg.append("text")
    .attr("x", (width + margin.left + margin.right) / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .style("font-weight", "bold")
    .text("Xác suất bán hàng theo Nhóm hàng và Tháng");

  // Chú thích (Legend) 
  const legend = svg.append("g")
                    .attr("transform", `translate(${width + margin.left + 20}, ${margin.top})`);

  nested.forEach(([key], i) => {
    const maNhom = key.match(/\[(.*?)\]/)?.[1];
    const colorValue = color(maNhom) || "#999";

    legend.append("rect")
      .attr("x", 0)
      .attr("y", i * 25)
      .attr("width", 18)
      .attr("height", 18)
      .attr("fill", colorValue);

    legend.append("text")
      .attr("x", 25)
      .attr("y", i * 25 + 14)
      .style("font-size", "12px")
      .text(key);
  });
});
