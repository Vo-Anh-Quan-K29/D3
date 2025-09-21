d3.csv("data.csv").then(function(data) {
  // Chuẩn hóa dữ liệu
  data.forEach(d => {
    d.SL = +d["SL"];
    d.DonGia = +d["Đơn giá"];
    d.DoanhThu = d.SL * d.DonGia;
  });

  // Gom nhóm theo Mã nhóm hàng + Mã mặt hàng + Tên mặt hàng
  const grouped = [];
  d3.group(data, d => d["Mã nhóm hàng"], d => d["Mã mặt hàng"], d => d["Tên mặt hàng"])
    .forEach((byMaMH, maNhom) => {
      byMaMH.forEach((byTen, ma) => {
        byTen.forEach((val, ten) => {
          grouped.push({
            Nhom: maNhom,
            Ma: ma,
            Ten: ten,
            SL: d3.sum(val, d => d.SL),
            DoanhThu: d3.sum(val, d => d.DoanhThu),
            HienThi: `[${ma}] ${ten}`
          });
        });
      });
    });

  // Sắp xếp giảm dần theo DoanhThu
  grouped.sort((a, b) => d3.descending(a.DoanhThu, b.DoanhThu));

  // Thiết lập SVG
  const svg = d3.select("#Chart1"),
        margin = {top: 40, right: 100, bottom: 30, left: 250},
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom;

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  // Thang đo
  const x = d3.scaleLinear()
              .domain([0, d3.max(grouped, d => d.DoanhThu)])
              .range([0, width]);

  const y = d3.scaleBand()
              .domain(grouped.map(d => d.HienThi))
              .range([0, height])
              .padding(0.2);

  // 🎨 Gradient màu theo nhóm
  const gradients = {
    "BOT": ["#1f77b4", "#1f77b4"],
    "SET": ["#ff7f0e", "#ff7f0e"],
    "THO": ["#2ca02c", "#2ca02c"],
    "TTC": ["#d62728", "#d62728"],
    "TMX": ["#9467bd", "#9467bd"]
  };

  const defs = svg.append("defs");
  Object.entries(gradients).forEach(([key, [start, end]]) => {
    const grad = defs.append("linearGradient")
      .attr("id", `grad-${key}`)
      .attr("x1", "0%").attr("y1", "0%")
      .attr("x2", "100%").attr("y2", "0%");
    grad.append("stop").attr("offset", "0%").attr("stop-color", start);
    grad.append("stop").attr("offset", "100%").attr("stop-color", end);
  });

  // Vẽ trục X
  g.append("g")
   .attr("transform", `translate(0,${height})`)
   .call(d3.axisBottom(x).tickFormat(d => (d / 1e6).toFixed(0) + "M"))
   .selectAll("text")
   .style("font-size", "15px")
   .style("font-weight", "bold");

  // Vẽ trục Y
  g.append("g")
   .call(d3.axisLeft(y))
   .selectAll("text")
   .style("font-size", "13px")
   .style("font-weight", "bold");

  // Vẽ các cột
  g.selectAll("rect")
    .data(grouped)
    .enter().append("rect")
      .attr("y", d => y(d.HienThi))
      .attr("width", d => x(d.DoanhThu))
      .attr("height", y.bandwidth())
      .attr("fill", d => `url(#grad-${d.Nhom})`)
    .append("title")
      .text(d => `${d.HienThi}\nDoanh thu: ${d3.format(",")(d.DoanhThu)} VND\nSL: ${d3.format(",")(d.SL)}`);

  // Ghi chú giá trị trên cột
  g.selectAll("text.value")
    .data(grouped)
    .enter().append("text")
      .attr("class", "value")
      .attr("x", d => x(d.DoanhThu) + 5)
      .attr("y", d => y(d.HienThi) + y.bandwidth() / 2 + 5)
      .text(d => (d.DoanhThu / 1e6).toFixed(1) + "M")
      .style("font-size", "12px")
      .style("fill", "#333")
      .style("font-weight", "bold");

  // Tiêu đề biểu đồ
  svg.append("text")
     .attr("x", (width + margin.left + margin.right) / 2)
     .attr("y", 20)
     .attr("text-anchor", "middle")
     .style("font-size", "18px")
     .style("font-weight", "bold")
     .text("Doanh số bán hàng theo Mặt hàng");
});
