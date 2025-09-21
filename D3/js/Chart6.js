d3.csv("data.csv").then(function(data) {
  // Chuẩn hóa dữ liệu
  data.forEach(d => {
    d.SL = +d["SL"];
    d.ThanhTien = +d["Thành tiền"];
    const date = new Date(d["Thời gian tạo đơn"]);
    d.Ngay = d3.timeDay(date); // bỏ giờ phút giây
    d.Gio = date.getHours();
    d.Khung_gio = `${String(d.Gio).padStart(2, "0")}:00-${String(d.Gio).padStart(2, "0")}:59`;
  });

  // Gom tổng theo Ngày + Khung giờ 
  const dailyArr = Array.from(
    d3.rollup(
      data,
      v => ({
        TongDoanhThu: d3.sum(v, d => d.ThanhTien),
        TongSKU: d3.sum(v, d => d.SL)
      }),
      d => d.Ngay,
      d => d.Khung_gio
    ),
    ([ngay, mapByHour]) =>
      Array.from(mapByHour, ([khung, val]) => ({
        Ngay: ngay,
        Khung_gio: khung,
        TongDoanhThu: val.TongDoanhThu,
        TongSKU: val.TongSKU
      }))
  ).flat();

  // Tính trung bình theo khung giờ 
  const grouped = Array.from(
    d3.rollup(
      dailyArr,
      v => ({
        DoanhThuTB: d3.mean(v, d => d.TongDoanhThu),
        SKU_TB: d3.mean(v, d => d.TongSKU)
      }),
      d => d.Khung_gio
    ),
    ([khung, val]) => ({
      Khung_gio: khung,
      DoanhThuTB: val.DoanhThuTB,
      SKU_TB: val.SKU_TB,
      GioInt: parseInt(khung.slice(0, 2))
    })
  ).sort((a, b) => d3.ascending(a.GioInt, b.GioInt));

  //Thiết lập SVG 
  const svg = d3.select("#Chart6"),
        margin = {top: 40, right: 50, bottom: 100, left: 100},
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom;

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleBand()
              .domain(grouped.map(d => d.Khung_gio))
              .range([0, width])
              .padding(0.2);

  const y = d3.scaleLinear()
              .domain([0, d3.max(grouped, d => d.DoanhThuTB)])
              .nice()
              .range([height, 0]);

  // 🎨 Màu : từ d3.interpolatePlasma theo giờ
  const color = d3.scaleSequential()
                  .domain([0, 23])
                  .interpolator(d3.interpolatePlasma);

  //  Vẽ trục X 
  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(45)")
    .style("text-anchor", "start")
    .style("font-size", "12px")
    .style("font-weight", "bold");

  // Vẽ trục Y 
  g.append("g")
    .call(d3.axisLeft(y).tickFormat(d => d >= 1e6 ? (d / 1e6).toFixed(0) + "M" : (d / 1e3).toFixed(0) + "K"))
    .selectAll("text")
    .style("font-size", "12px")
    .style("font-weight", "bold");

  //  Vẽ cột 
  g.selectAll("rect")
    .data(grouped)
    .enter().append("rect")
      .attr("x", d => x(d.Khung_gio))
      .attr("y", d => y(d.DoanhThuTB))
      .attr("width", x.bandwidth())
      .attr("height", d => height - y(d.DoanhThuTB))
      .attr("fill", d => color(d.GioInt))
    .append("title")
      .text(d => `${d.Khung_gio}\nDoanh thu TB: ${d3.format(",.0f")(d.DoanhThuTB)} VND\nSKU TB: ${Math.round(d.SKU_TB)}`);

  //  Nhãn trên cột 
  g.selectAll("text.value")
    .data(grouped)
    .enter().append("text")
      .attr("class", "value")
      .attr("x", d => x(d.Khung_gio) + x.bandwidth() / 2)
      .attr("y", d => y(d.DoanhThuTB) - 5)
      .attr("text-anchor", "middle")
      .style("font-size", "10px")
      .style("font-weight", "bold")
      .text(d => d.DoanhThuTB >= 1e6
                 ? (d.DoanhThuTB / 1e6).toFixed(1) + "M"
                 : (d.DoanhThuTB / 1e3).toFixed(0) + "K");

  //  Tiêu đề 
  svg.append("text")
     .attr("x", (width + margin.left + margin.right) / 2)
     .attr("y", 25)
     .attr("text-anchor", "middle")
     .style("font-size", "18px")
     .style("font-weight", "bold")
     .text("Doanh số bán hàng theo Khung giờ");
});
