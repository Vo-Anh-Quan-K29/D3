d3.csv("data.csv").then(function(data) {
  // Chuẩn hóa dữ liệu
  data.forEach(d => {
    d.SL = +d["SL"];
    d.DonGia = +d["Đơn giá"];
    d.DoanhThu = d.SL * d.DonGia;
  });

  // Gom nhóm theo Mã nhóm hàng + Tên nhóm hàng
  const grouped = [];
  d3.group(data, d => d["Mã nhóm hàng"], d => d["Tên nhóm hàng"])
    .forEach((byTen, maNhom) => {
      byTen.forEach((val, tenNhom) => {
        grouped.push({
          Nhom: maNhom,
          Ten: tenNhom,
          SL: d3.sum(val, d => d.SL),
          DoanhThu: d3.sum(val, d => d.DoanhThu),
          HienThi: `[${maNhom}] ${tenNhom}`
        });
      });
    });

  // Sắp xếp theo DoanhThu giảm dần
  grouped.sort((a, b) => d3.descending(a.DoanhThu, b.DoanhThu));

  // Khởi tạo SVG
  const svg = d3.select("#Chart2"),
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

  // 🎨 Màu theo mã nhóm
const gradients = {
  "BOT": "#00bcd4",  // Bột
  "SET": "#ff9800",  // Set trà
  "THO": "#8bc34a",  // Trà hoa
  "TTC": "#e91e63",  // Trà củ/quả sấy
  "TMX": "#673ab7"   // Trà mix
};


  const color = d3.scaleOrdinal()
                  .domain(Object.keys(gradients))
                  .range(Object.values(gradients));

  // Trục X
  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(d => d >= 1e9 ? (d / 1e9).toFixed(1) + "B" : (d / 1e6).toFixed(0) + "M"))
    .selectAll("text")
    .style("font-weight", "bold")
    .style("font-size", "15px");

  // Trục Y
  g.append("g")
    .call(d3.axisLeft(y))
    .selectAll("text")
    .style("font-weight", "bold")
    .style("font-size", "15px");

  // Vẽ cột
  g.selectAll("rect")
    .data(grouped)
    .enter().append("rect")
      .attr("y", d => y(d.HienThi))
      .attr("width", d => x(d.DoanhThu))
      .attr("height", y.bandwidth())
      .attr("fill", d => color(d.Nhom))
    .append("title")
      .text(d => `${d.HienThi}\nDoanh thu: ${d3.format(",")(d.DoanhThu)} VND`);

  // Giá trị trên cột
  g.selectAll("text.value")
    .data(grouped)
    .enter().append("text")
      .attr("class", "value")
      .attr("x", d => x(d.DoanhThu) + 5)
      .attr("y", d => y(d.HienThi) + y.bandwidth() / 2 + 5)
      .text(d => d.DoanhThu >= 1e9 ? (d.DoanhThu / 1e9).toFixed(1) + "B" : (d.DoanhThu / 1e6).toFixed(1) + "M")
      .style("font-size", "13px")
      .style("fill", "#333")
      .style("font-weight", "bold");

  // Tiêu đề biểu đồ
  svg.append("text")
     .attr("x", (width + margin.left + margin.right) / 2)
     .attr("y", 20)
     .attr("text-anchor", "middle")
     .style("font-size", "18px")
     .style("font-weight", "bold")
     .text("Doanh số bán hàng theo Nhóm hàng");
});
