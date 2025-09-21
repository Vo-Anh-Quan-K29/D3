d3.csv("data.csv").then(function (rows) {
  const KH_COL = "Mã khách hàng";
  const MONEY_COL = "Thành tiền";

  //  Gom tổng chi tiêu của mỗi khách hàng và giới hạn max 3 triệu
  const custSpend = d3.rollup(
    rows,
    v => d3.sum(v, d => +d[MONEY_COL] || 0),
    d => d[KH_COL]
  );

  //  Clamp chi tiêu về tối đa 3 triệu
  const spending = Array.from(custSpend.values(), d => Math.min(d, 3000000));

  if (spending.length === 0) {
    console.warn("Không có dữ liệu chi tiêu khách hàng");
    return;
  }

  //  Phân bin với binSize = 50,000
  const binSize = 50000;
  const maxVal = 3000000;
  const bins = d3.bin()
    .domain([0, maxVal])
    .thresholds(d3.range(0, maxVal + binSize, binSize))(spending);

  //  Setup SVG
  const svg = d3.select("#Chart12");
  const W = +svg.attr("width");
  const H = +svg.attr("height");
  const margin = { top: 40, right: 30, bottom: 60, left: 70 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  //  Thang đo
  const x = d3.scaleLinear()
    .domain([0, maxVal])
    .range([0, innerW]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(bins, d => d.length)])
    .nice()
    .range([innerH, 0]);

  //  Trục X dạng "k" cách nhau 100k
  const xticks = d3.range(0, maxVal + 100000, 100000);
  const xAxis = d3.axisBottom(x)
    .tickValues(xticks)
    .tickFormat(d => `${d / 1000}k`);

  //  Vẽ cột histogram + tooltip
  g.selectAll("rect")
    .data(bins)
    .enter()
    .append("rect")
    .attr("x", d => x(d.x0))
    .attr("y", d => y(d.length))
    .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
    .attr("height", d => innerH - y(d.length))
    .attr("fill", "skyblue")
    .attr("stroke", "black")
    .attr("opacity", 0.7)
    .append("title")
    .text(d => {
      const from = (d.x0 / 1000) + "k";
      const to = (d.x1 / 1000) + "k";
      return `Khoảng: ${from} – ${to}\nSố KH: ${d.length}`;
    });

  //  Trục X & Y
  g.append("g")
    .attr("transform", `translate(0,${innerH})`)
    .call(xAxis);

  g.append("g")
    .call(d3.axisLeft(y));

  //  Grid ngang
  g.append("g")
    .attr("class", "grid")
    .call(d3.axisLeft(y).tickSize(-innerW).tickFormat(""))
    .selectAll("line")
    .attr("stroke", "#ccc")
    .attr("stroke-dasharray", "2,2");

  //  Nhãn trục
  svg.append("text")
    .attr("x", W / 2)
    .attr("y", H - 10)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .text("Số tiền chi trả (VNĐ)");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -H / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .text("Số lượng khách hàng");

  //  Tiêu đề biểu đồ
  svg.append("text")
    .attr("x", W / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text("Phân phối Mức chi trả của Khách hàng");
});
