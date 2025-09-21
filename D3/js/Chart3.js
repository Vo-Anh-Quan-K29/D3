d3.csv("data.csv").then(function(data) {
  // Chuẩn hóa dữ liệu
  data.forEach(d => {
    d.SL = +d["SL"];
    d.DonGia = +d["Đơn giá"];
    d.DoanhThu = d.SL * d.DonGia;
    d.Thang = new Date(d["Thời gian tạo đơn"]).getMonth() + 1; // 1-12
  });

  // Gom nhóm theo Tháng
  const grouped = [];
  d3.group(data, d => d.Thang)
    .forEach((val, thang) => {
      grouped.push({
        Thang: thang,
        SL: d3.sum(val, d => d.SL),
        DoanhThu: d3.sum(val, d => d.DoanhThu),
        HienThi: `T${String(thang).padStart(2, "0")}`
      });
    });

  // Sắp xếp theo tháng tăng dần
  grouped.sort((a, b) => d3.ascending(a.Thang, b.Thang));

  // Thiết lập SVG
  const svg = d3.select("#Chart3"),
        margin = {top: 40, right: 50, bottom: 50, left: 100},
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom;

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  // Thang đo
  const x = d3.scaleBand()
              .domain(grouped.map(d => d.HienThi))
              .range([0, width])
              .padding(0.2);

  const y = d3.scaleLinear()
              .domain([0, d3.max(grouped, d => d.DoanhThu)])
              .range([height, 0]);

  // 🎨 Màu cố định cho 12 tháng
  const fixedColors = [
    "#4CAF50", "#FF9800", "#03A9F4", "#E91E63",
    "#9C27B0", "#F44336", "#3F51B5", "#009688",
    "#FFC107", "#795548", "#607D8B", "#8BC34A"
  ];

  const color = d3.scaleOrdinal()
                  .domain(grouped.map(d => d.Thang))
                  .range(fixedColors);

  // Trục X
  g.append("g")
   .attr("transform", `translate(0,${height})`)
   .call(d3.axisBottom(x))
   .selectAll("text")
   .style("font-size", "13px")
   .style("font-weight", "bold");

  // Trục Y
  g.append("g")
   .call(d3.axisLeft(y).tickFormat(d => (d / 1e6).toFixed(0) + "M"))
   .selectAll("text")
   .style("font-size", "13px")
   .style("font-weight", "bold");

  // Vẽ cột
  g.selectAll("rect")
    .data(grouped)
    .enter().append("rect")
      .attr("x", d => x(d.HienThi))
      .attr("y", d => y(d.DoanhThu))
      .attr("width", x.bandwidth())
      .attr("height", d => height - y(d.DoanhThu))
      .attr("fill", (d, i) => fixedColors[i % fixedColors.length])
    .append("title")
      .text(d => `${d.HienThi}\nDoanh thu: ${d3.format(",")(d.DoanhThu)} VND`);

  // Nhãn trên cột
  g.selectAll("text.value")
    .data(grouped)
    .enter().append("text")
      .attr("class", "value")
      .attr("x", d => x(d.HienThi) + x.bandwidth() / 2)
      .attr("y", d => y(d.DoanhThu) - 5)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .text(d => (d.DoanhThu / 1e6).toFixed(1) + "M");

  // Tiêu đề biểu đồ
  svg.append("text")
     .attr("x", (width + margin.left + margin.right) / 2)
     .attr("y", 20)
     .attr("text-anchor", "middle")
     .style("font-size", "18px")
     .style("font-weight", "bold")
     .text("Doanh số bán hàng theo Tháng");
});
