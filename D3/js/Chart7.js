d3.csv("data.csv").then(function(data) {
  // Tính tổng số đơn hàng duy nhất 
  const tongDonHang = new Set(data.map(d => d["Mã đơn hàng"])).size;

  // Gom theo nhóm hàng và đếm đơn hàng duy nhất 
  const grouped = [];
  d3.rollup(
    data,
    v => new Set(v.map(d => d["Mã đơn hàng"])).size,
    d => d["Mã nhóm hàng"],
    d => d["Tên nhóm hàng"]
  ).forEach((byTen, maNhom) => {
    byTen.forEach((count, tenNhom) => {
      grouped.push({
        MaNhom: maNhom,
        TenNhom: tenNhom,
        DonHang: count,
        XacSuat: count / tongDonHang,
        HienThi: `[${maNhom}] ${tenNhom}`
      });
    });
  });

  //  Sắp xếp giảm dần theo xác suất 
  grouped.sort((a, b) => d3.descending(a.XacSuat, b.XacSuat));

  //  Vẽ biểu đồ 
  const svg = d3.select("#Chart7"),
        margin = {top: 40, right: 50, bottom: 40, left: 300},
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom;

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear()
              .domain([0, d3.max(grouped, d => d.XacSuat)])
              .nice()
              .range([0, width]);

  const y = d3.scaleBand()
              .domain(grouped.map(d => d.HienThi))
              .range([0, height])
              .padding(0.2);

  // 🎨 Màu theo từng mã nhóm hàng
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

  //  Trục X (dạng phần trăm) 
  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(d3.format(".0%")))
    .selectAll("text")
    .style("font-size", "13px")
    .style("font-weight", "bold");

  //  Trục Y 
  g.append("g")
    .call(d3.axisLeft(y))
    .selectAll("text")
    .style("font-size", "13px")
    .style("font-weight", "bold");

  //  Vẽ cột ngang 
  g.selectAll("rect")
    .data(grouped)
    .enter().append("rect")
      .attr("y", d => y(d.HienThi))
      .attr("x", 0)
      .attr("width", d => x(d.XacSuat))
      .attr("height", y.bandwidth())
      .attr("fill", d => color(d.MaNhom))
    .append("title")
      .text(d => `${d.HienThi}\nXác suất: ${(d.XacSuat * 100).toFixed(2)}%`);

  //  Ghi nhãn phần trăm 
  g.selectAll("text.value")
    .data(grouped)
    .enter().append("text")
      .attr("class", "value")
      .attr("x", d => x(d.XacSuat) + 5)
      .attr("y", d => y(d.HienThi) + y.bandwidth() / 2 + 5)
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .text(d => (d.XacSuat * 100).toFixed(1) + "%");

  //  Tiêu đề 
  svg.append("text")
     .attr("x", (width + margin.left + margin.right) / 2)
     .attr("y", 20)
     .attr("text-anchor", "middle")
     .style("font-size", "18px")
     .style("font-weight", "bold")
     .text("Xác suất bán hàng theo Nhóm hàng");
});
