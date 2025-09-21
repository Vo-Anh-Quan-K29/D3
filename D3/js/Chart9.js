d3.csv("data.csv").then(function(data) {
  //  Chuẩn hóa dữ liệu 
  const grouped = d3.rollups(
    data,
    v => new Set(v.map(d => d["Mã đơn hàng"])).size,
    d => d["Mã nhóm hàng"],
    d => d["Tên nhóm hàng"],
    d => d["Mã mặt hàng"],
    d => d["Tên mặt hàng"]
  );

  const merged = [];
  grouped.forEach(([maNhom, tenNhomGroups]) => {
    tenNhomGroups.forEach(([tenNhom, maMHGroups]) => {
      let tong = 0;
      maMHGroups.forEach(([maMH, tenMHGroups]) => {
        tenMHGroups.forEach(([tenMH, soDH]) => {
          tong += soDH;
        });
      });
      maMHGroups.forEach(([maMH, tenMHGroups]) => {
        tenMHGroups.forEach(([tenMH, soDH]) => {
          merged.push({
            Nhom: maNhom,
            TenNhom: tenNhom,
            MaMH: maMH,
            TenMH: tenMH,
            HienThi: `[${maMH}] ${tenMH}`,
            XacSuat: soDH / tong
          });
        });
      });
    });
  });

  //  Gom nhóm theo Nhóm hàng 
  let groupedByNhom = d3.groups(merged, d => d.Nhom, d => d.TenNhom);

  //  SẮP XẾP theo yêu cầu: BOT, SET, THO, TMX, TTC
  const desiredOrder = ["BOT", "SET", "THO", "TMX", "TTC"];
  groupedByNhom.sort((a, b) => desiredOrder.indexOf(a[0]) - desiredOrder.indexOf(b[0]));

  //  SVG chia lưới 
  const svg = d3.select("#Chart9"),
        totalWidth = +svg.attr("width"),
        totalHeight = +svg.attr("height");

  const cols = 3;
  const rows = 2;
  const padding = 80;
  const cellWidth = (totalWidth - padding) / cols;
  const cellHeight = (totalHeight - padding) / rows;

  //  Mảng các thang màu khác nhau 
  const colorScales = [
    d3.interpolateViridis,
    d3.interpolatePlasma,
    d3.interpolateInferno,
    d3.interpolateMagma,
    d3.interpolateTurbo
  ];

  //  Vẽ từng subplot 
  groupedByNhom.forEach(([maNhom, tenNhomGroups], i) => {
    const tenNhom = tenNhomGroups[0][0];
    const arr = tenNhomGroups.flatMap(g => g[1]);

    const col = i % cols;
    const row = Math.floor(i / cols);

    const g = svg.append("g")
      .attr("transform", `translate(${col * cellWidth + 60},${row * cellHeight + 60})`);

    const x = d3.scaleLinear()
      .domain([0, d3.max(arr, d => d.XacSuat)])
      .range([0, cellWidth - 120]);

    const y = d3.scaleBand()
      .domain(arr.sort((a, b) => d3.descending(a.XacSuat, b.XacSuat)).map(d => d.HienThi))
      .range([0, Math.max(150, arr.length * 20)])  // 👈 đủ chỗ cho nhiều dòng
      .padding(0.2);

    // 🎨 Thang màu riêng từng nhóm
    const colorFn = colorScales[i % colorScales.length];
    const color = d3.scaleOrdinal()
      .domain(arr.map(d => d.HienThi))
      .range(arr.map((_, idx) => colorFn(idx / Math.max(1, arr.length - 1))));

    //  Trục X 
    g.append("g")
      .attr("transform", `translate(0,${y.range()[1]})`)
      .call(d3.axisBottom(x).tickFormat(d3.format(".0%")).ticks(5));

    //  Trục Y 
    g.append("g")
      .call(d3.axisLeft(y).tickSize(0))
      .select(".domain").remove();

    //  Bar 
    g.selectAll("rect")
      .data(arr)
      .enter().append("rect")
        .attr("y", d => y(d.HienThi))
        .attr("width", d => x(d.XacSuat))
        .attr("height", y.bandwidth())
        .attr("fill", d => color(d.HienThi))
      .append("title")
        .text(d => `${d.HienThi}\nXác suất: ${(d.XacSuat * 100).toFixed(2)}%`);

    //  Label %
    g.selectAll("text.value")
      .data(arr)
      .enter().append("text")
        .attr("class", "value")
        .attr("x", d => x(d.XacSuat) + 5)
        .attr("y", d => y(d.HienThi) + y.bandwidth() / 2 + 4)
        .text(d => d3.format(".0%")(d.XacSuat))
        .style("font-size", "11px");

    //  Sub-title 
    g.append("text")
      .attr("class", "sub-title")
      .attr("x", (cellWidth - 100) / 2)
      .attr("y", -15)
      .attr("text-anchor", "middle")
      .style("font-size", "13px")
      .style("font-weight", "bold")
      .text(`[${maNhom}] ${tenNhom}`);
  });

  //  Tiêu đề chung 
  svg.append("text")
    .attr("x", totalWidth / 2)
    .attr("y", 25)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .style("font-weight", "bold")
    .text("Xác suất bán hàng theo Mặt hàng trong từng Nhóm hàng");
});
