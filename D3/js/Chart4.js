d3.csv("data.csv").then(function(data) {
  // Chuẩn hóa dữ liệu
  data.forEach(d => {
    d.SL = +d["SL"];
    d.DonGia = +d["Đơn giá"];
    d.ThanhTien = +d["Thành tiền"];
    d.Ngay = new Date(d["Thời gian tạo đơn"]);
  });

  // Gom theo ngày 
  const daily = Array.from(
    d3.rollup(
      data,
      v => ({
        TongDoanhThu: d3.sum(v, d => d.ThanhTien),
        TongSKU: d3.sum(v, d => d.SL)
      }),
      d => d3.timeDay(d.Ngay)
    ),
    ([ngay, val]) => ({
      Ngay: ngay,
      TongDoanhThu: val.TongDoanhThu,
      TongSKU: val.TongSKU,
      Thu: ngay.getDay() === 0 ? 6 : ngay.getDay() - 1 // Mon = 0 ... Sun = 6
    })
  );

  // Bản đồ thứ hiển thị
  const thuMap = {
    0: "Thứ 2",
    1: "Thứ 3",
    2: "Thứ 4",
    3: "Thứ 5",
    4: "Thứ 6",
    5: "Thứ 7",
    6: "Chủ nhật"
  };

  // Gom theo thứ trong tuần và tính trung bình
  const grouped = Array.from(
    d3.rollup(
      daily,
      v => ({
        DoanhThuTB: d3.mean(v, d => d.TongDoanhThu),
        SKUTB: d3.mean(v, d => d.TongSKU)
      }),
      d => d.Thu
    ),
    ([thu, val]) => ({
      Thu: thu,
      ThuHienThi: thuMap[thu],
      DoanhThuTB: val.DoanhThuTB,
      SKUTB: val.SKUTB
    })
  ).sort((a, b) => d3.ascending(a.Thu, b.Thu));

  // Thiết lập SVG
  const svg = d3.select("#Chart4"),
        margin = {top: 40, right: 50, bottom: 50, left: 100},
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom;

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  // Thang đo
  const x = d3.scaleBand()
              .domain(grouped.map(d => d.ThuHienThi))
              .range([0, width])
              .padding(0.3);

  const y = d3.scaleLinear()
              .domain([0, d3.max(grouped, d => d.DoanhThuTB)])
              .range([height, 0]);

  // 🎨 Màu mới cho từng ngày trong tuần
  const fixedColors = [
    "#4CAF50", // Thứ 2
    "#2196F3", // Thứ 3
    "#FFC107", // Thứ 4
    "#9C27B0", // Thứ 5
    "#FF5722", // Thứ 6
    "#3F51B5", // Thứ 7
    "#E91E63"  // Chủ nhật
  ];

  const color = d3.scaleOrdinal()
                  .domain(grouped.map(d => d.ThuHienThi))
                  .range(fixedColors);

  // Trục X
  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .style("font-weight", "bold")
    .style("font-size", "13px");

  // Trục Y
  g.append("g")
    .call(d3.axisLeft(y).tickFormat(d => (d / 1e6).toFixed(0) + "M"))
    .selectAll("text")
    .style("font-weight", "bold")
    .style("font-size", "13px");

  // Vẽ cột
  g.selectAll("rect")
    .data(grouped)
    .enter().append("rect")
      .attr("x", d => x(d.ThuHienThi))
      .attr("y", d => y(d.DoanhThuTB))
      .attr("width", x.bandwidth())
      .attr("height", d => height - y(d.DoanhThuTB))
      .attr("fill", d => color(d.ThuHienThi))
    .append("title")
      .text(d => `${d.ThuHienThi}\nDoanh thu TB: ${d3.format(",.0f")(d.DoanhThuTB)} VND\nSKU TB: ${Math.round(d.SKUTB)}`);

  // Nhãn trên cột
  g.selectAll("text.value")
    .data(grouped)
    .enter().append("text")
      .attr("class", "value")
      .attr("x", d => x(d.ThuHienThi) + x.bandwidth() / 2)
      .attr("y", d => y(d.DoanhThuTB) - 5)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .text(d => (d.DoanhThuTB / 1e6).toFixed(1) + "M");

  // Tiêu đề biểu đồ
  svg.append("text")
     .attr("x", (width + margin.left + margin.right) / 2)
     .attr("y", 20)
     .attr("text-anchor", "middle")
     .style("font-size", "18px")
     .style("font-weight", "bold")
     .text("Doanh số bán hàng theo Ngày trong tuần");
});
