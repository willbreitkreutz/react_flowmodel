import React, { useEffect, useState } from "react";
import { connect } from "redux-bundler-react";
import Plot from "react-plotly.js";

export default connect(
  "selectAnimateCurrentData",
  ({ animateCurrentData: dataframe }) => {
    if (!dataframe) return null;
    const { i, t, modelData, modelMidpoints } = dataframe;

    const [data, setData] = useState([]);
    const [layout, setLayout] = useState({});
    const [config, setConfig] = useState({});

    useEffect(() => {
      if (!modelData.iceElevation || !modelMidpoints.diffusivity)
        return undefined;
      setData([
        {
          x: modelData.iceElevation.x,
          y: modelData.iceElevation.y,
          name: "Ice Surface",
          type: "scattergl",
          mode: "lines",
          marker: { color: "blue" },
        },
        {
          x: modelData.bedElevation.x,
          y: modelData.bedElevation.y,
          name: "Bed",
          type: "scattergl",
          mode: "lines",
          marker: { color: "brown" },
        },
        {
          x: modelMidpoints.velocity.x,
          y: modelMidpoints.velocity.y,
          name: "Velocity",
          type: "scattergl",
          mode: "lines",
          marker: { color: "purple" },
        },
        {
          x: modelData.massBalanceFlux.x,
          y: modelData.massBalanceFlux.y,
          name: "Mass Balance",
          type: "scattergl",
          mode: "lines",
          xaxis: "x",
          yaxis: "y2",
          marker: { color: "#e4b3f5" },
        },
        {
          x: modelData.flux_up.x,
          y: modelData.flux_up.y,
          name: "Flux (up)",
          type: "scattergl",
          mode: "lines",
          xaxis: "x",
          yaxis: "y4",
          marker: { color: "#8111c2" },
        },
        {
          x: modelData.flux_down.x,
          y: modelData.flux_down.y,
          name: "Flux (down)",
          type: "scattergl",
          mode: "lines",
          xaxis: "x",
          yaxis: "y5",
          marker: { color: "#e67207" },
        },
        {
          x: modelData.flux_up.x,
          y: modelData.flux_down.y.map((y, i) => {
            return y + modelData.flux_up.y[i];
          }),
          name: "Lateral Flux",
          type: "scattergl",
          mode: "lines",
          xaxis: "x",
          yaxis: "y9",
          marker: { color: "#0abac9" },
        },
        {
          x: modelData.totalFlux.x,
          y: modelData.totalFlux.y,
          name: "Total Flux",
          type: "scattergl",
          mode: "lines",
          xaxis: "x",
          yaxis: "y6",
          marker: { color: "#db0948" },
        },
        {
          x: modelMidpoints.diffusivity.x,
          y: modelMidpoints.diffusivity.y,
          name: "Midpoint Diffusivity",
          type: "scattergl",
          mode: "lines",
          xaxis: "x",
          yaxis: "y7",
          marker: { color: "#500c87" },
        },
        {
          x: modelMidpoints.slope.x,
          y: modelMidpoints.slope.y,
          name: "Slope",
          type: "scattergl",
          mode: "lines",
          xaxis: "x",
          yaxis: "y8",
          marker: { color: "#0b9917" },
        },
        {
          x: modelData.deltaH.x,
          y: modelData.deltaH.y,
          name: "Delta H",
          type: "scattergl",
          mode: "lines",
          xaxis: "x",
          yaxis: "y10",
          marker: { color: "#0b7899" },
        },
      ]);
    }, [modelData, modelMidpoints]);

    useEffect(() => {
      setLayout({
        autosize: true,
        title: "Flowline",
        dragmode: "pan",
        grid: {
          rows: 10,
          columns: 1,
          subplots: [
            ["xy"],
            ["xy2"],
            ["xy3"],
            ["xy4"],
            ["xy5"],
            ["xy9"],
            ["xy6"],
            ["xy7"],
            ["xy8"],
            ["xy10"],
          ],
        },
        xaxis: {
          title: "Distance Along Centerline in Model Columns",
          rangemode: "tozero",
        },
        yaxis: {
          title: "Elevation (m)",
          rangemode: "tozero",
          range: [0, 3000],
        },
        yaxis2: {
          title: {
            text: "Velocity",
          },
        },
        yaxis3: {
          title: {
            text: "Mass balance Flux (m)",
          },
          rangemode: "tozero",
        },
        yaxis4: {
          title: {
            text: "Flux (up)",
          },
        },
        yaxis5: {
          title: {
            text: "Flux (down)",
          },
        },
        yaxis9: {
          title: {
            text: "Lateral Flux",
          },
        },
        yaxis6: {
          title: {
            text: "Flux (total)",
          },
        },
        yaxis7: {
          title: {
            text: "Diffusivity",
          },
        },
        yaxis8: {
          title: {
            text: "Slope",
          },
        },
        yaxis10: {
          title: {
            text: "DeltaH",
          },
        },
      });
    }, []);

    useEffect(() => {
      setConfig({
        responsive: true,
        displaylogo: false,
        displayModeBar: true,
        modeBarButtonsToRemove: [
          "select2d",
          "lasso2d",
          "zoomIn2d",
          "zoomOut2d",
        ],
        scrollZoom: true,
      });
    }, []);

    const handleUpdate = ({ data, layout, config }) => {
      setData(data);
      setLayout(layout);
      setConfig(config);
    };

    return (
      <div>
        <p>{`${t} years, ${i} model iterations`}</p>
        <Plot
          onInitialized={handleUpdate}
          onUpdate={handleUpdate}
          revision={i}
          style={{ width: "100%", height: "1500px" }}
          data={data}
          layout={layout}
          config={config}
        />
      </div>
    );
  }
);
