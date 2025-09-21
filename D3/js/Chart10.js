d3.csv("data.csv").then(function (raw) {
  //  Chuẩn hóa & sinh cột Tháng
  const parse = d3.timeParse("%Y-%m-%d %H:%M:%S");
  raw.forEach(d => {
    const t = parse(d["Thời gian tạo đơn"]);
    d.__month = t ? (t.getMonth() + 1) : null;
    d.__maDon = d["Mã đơn hàng"];
    d.__nhomMa = d["Mã nhóm hàng"];
    d.__nhomTen = d["Tên nhóm hàng"];
    d.__mhMa = d["Mã mặt hàng"];
    d.__mhTen = d["Tên mặt hàng"];
  });

  const data = raw.filter(d => d.__month != null);

  //  Đếm đơn hàng duy nhất theo Nhóm hàng + Tháng
  const groupMonthSets = new Map();
  for (const d of data) {
    const key = `${d.__month}|${d.__nhomMa}|${d.__nhomTen}`;
    if (!groupMonthSets.has(key)) groupMonthSets.set(key, new Set());
    groupMonthSets.get(key).add(d.__maDon);
  }

  //  Đếm đơn hàng duy nhất theo Mặt hàng trong từng nhóm theo Tháng
  const itemMonthSets = new Map();
  for (const d of data) {
    const key = `${d.__month}|${d.__nhomMa}|${d.__nhomTen}|${d.__mhMa}|${d.__mhTen}`;
    if (!itemMonthSets.has(key)) itemMonthSets.set(key, new Set());
    itemMonthSets.get(key).add(d.__maDon);
  }

  //  Tạo bảng dữ liệu tỉ lệ
  const records = [];
  itemMonthSets.forEach((setItem, key) => {
    const [m, nhMa, nhTen, mhMa, mhTen] = key.split("|");
    const totalKey = `${m}|${nhMa}|${nhTen}`;
    const total = groupMonthSets.has(totalKey) ? groupMonthSets.get(totalKey).size : 0;
    const itemC = setItem.size;
    const tyle = total > 0 ? (itemC / total) : 0;
    records.push({
      Thang: +m,
      NhomMa: nhMa,
      NhomTen: nhTen,
      MhMa: mhMa,
      MhTen: mhTen,
      HienThi: `[${mhMa}] ${mhTen}`,
      TyLe: tyle
    });
  });

  //  Gom theo Nhóm hàng
  let groups = d3.groups(records, d => d.NhomTen, d => d.MhMa + "|" + d.MhTen);


  const ttcGroup = groups.find(([tenNhom]) => tenNhom.includes("TTC") || tenNhom.includes("Trà củ"));
  groups = groups.filter(([tenNhom]) => !(tenNhom.includes("TTC") || tenNhom.includes("Trà củ")));
  if (ttcGroup) groups.push(ttcGroup);

  //  Setup SVG grid
  const svg = d3.select("#Chart10");
  const W = +svg.attr("width");
  const H = +svg.attr("height");

  const cols = 3;
  const padTop = 40, padLeft = 40, padRight = 20, padBottom = 30;
  const subW = (W - padLeft - padRight) / cols;
  const rows = Math.ceil(groups.length / cols);
  const subH = (H - padTop - padBottom) / rows;

  // Tiêu đề chính
  svg.append("text")
    .attr("x", W / 2)
    .attr("y", 24)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text("Xác suất bán hàng của Mặt hàng theo Nhóm hàng theo từng Tháng");

  //  Vẽ từng subplot
  groups.forEach(([nhomTen, itemArr], idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);

    const g = svg.append("g")
      .attr("transform", `translate(${padLeft + col * subW}, ${padTop + row * subH})`);

    const x = d3.scalePoint()
      .domain(d3.range(1, 13))
      .range([40, subW - 20])
      .padding(0.5);

    const series = itemArr.map(([mhKey, recs]) => {
      const [mhMa, mhTen] = mhKey.split("|");
      const label = `[${mhMa}] ${mhTen}`;
      const byMonth = new Map(recs.map(r => [r.Thang, r.TyLe]));
      const pts = d3.range(1, 13).map(m => ({
        Thang: m,
        TyLe: byMonth.get(m) ?? 0
      }));
      return { label, points: pts };
    });

    let nhomMa = "";
    for (const [, recs] of itemArr) {
      if (recs && recs.length) {
        nhomMa = recs[0].NhomMa;
        break;
      }
    }

    // Y-scale theo từng nhóm
    let yDomain, yTicks;
    if (nhomMa === "BOT") {
      yDomain = [0.5, 1.5];
      yTicks = [0.5, 1.0, 1.5];
    } else if (nhomMa === "SET") {
      yDomain = [0.05, 0.25];
    } else if (nhomMa === "THO") {
      yDomain = [0.1, 0.35];
    } else if (nhomMa === "TTC") {
      yDomain = [0.25, 0.8];
    } else if (nhomMa === "TMX") {
      yDomain = [0.25, 0.55];
    } else {
      const yMax = d3.max(series.flatMap(s => s.points.map(p => p.TyLe))) || 0;
      yDomain = [0, Math.max(0.001, yMax * 1.1)];
    }

    const y = d3.scaleLinear()
      .domain(yDomain)
      .range([subH - 40, 20]);

    // Trục X
    g.append("g")
      .attr("transform", `translate(0,${subH - 40})`)
      .call(d3.axisBottom(x).tickFormat(m => `T${String(m).padStart(2, "0")}`));

    // Trục Y
    const yAxis = d3.axisLeft(y)
      .tickFormat(d3.format(".0%"));

    if (yTicks) yAxis.tickValues(yTicks);

    g.append("g")
      .attr("transform", `translate(40,0)`)
      .call(yAxis);

    // Tiêu đề phụ
    g.append("text")
      .attr("x", (subW - 60) / 2 + 40)
      .attr("y", 10)
      .attr("text-anchor", "middle")
      .style("font-weight", "bold")
      .text(`[${nhomMa}] ${nhomTen}`);

    // 🎨 Màu theo mặt hàng trong nhóm – Plasma
    const color = d3.scaleOrdinal()
      .domain(series.map(s => s.label))
      .range(series.map((_, i) => d3.interpolatePlasma(i / Math.max(1, series.length - 1))));

    const line = d3.line()
      .x(d => x(d.Thang))
      .y(d => y(d.TyLe));

    // Vẽ line và điểm
    series.forEach(s => {
      g.append("path")
        .attr("fill", "none")
        .attr("stroke", color(s.label))
        .attr("stroke-width", 2)
        .attr("d", line(s.points));

      g.selectAll(null)
        .data(s.points)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.Thang))
        .attr("cy", d => y(d.TyLe))
        .attr("r", 2.5)
        .attr("fill", color(s.label))
        .append("title")
        .text(d => `${s.label}\nTháng: T${String(d.Thang).padStart(2, "0")}\nTỷ lệ: ${(d.TyLe * 100).toFixed(2)}%`);
    });
  });
}).catch(err => {
  console.error("C10 error:", err);
});
