import React, { useEffect, useState } from "react";
import { connect } from "redux-bundler-react";
import Plot from "react-plotly.js";

export default connect(
  "doModelRun",
  "doModelStop",
  "selectModelTime",
  "selectModelRevision",
  "selectModelData",
  "selectModelMidpointData",
  ({
    doModelRun,
    doModelStop,
    modelTime,
    modelRevision: revision,
    modelData,
    modelMidpointData: modelMidpoints,
  }) => {
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
          x: modelData.diffusivity_down.x,
          y: modelData.diffusivity_down.y,
          name: "Diffusivity",
          type: "scattergl",
          mode: "lines",
          xaxis: "x",
          yaxis: "y3",
          marker: { color: "#ed32e1" },
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
          yaxis: "y6",
          marker: { color: "#0abac9" },
        },
        {
          x: modelData.totalFlux.x,
          y: modelData.totalFlux.y,
          name: "Total Flux",
          type: "scattergl",
          mode: "lines",
          xaxis: "x",
          yaxis: "y7",
          marker: { color: "#0abac9" },
        },
        {
          x: modelMidpoints.diffusivity.x,
          y: modelMidpoints.diffusivity.y,
          name: "Midpoint Diffusivity",
          type: "scattergl",
          mode: "lines",
          xaxis: "x",
          yaxis: "y8",
          marker: { color: "#0abac9" },
        },
        {
          x: modelMidpoints.slope.x,
          y: modelMidpoints.slope.y,
          name: "Slope",
          type: "scattergl",
          mode: "lines",
          xaxis: "x",
          yaxis: "y9",
          marker: { color: "#0abac9" },
        },
        {
          x: modelMidpoints.flux.x,
          y: modelMidpoints.flux.y,
          name: "Midpoint Flux",
          type: "scattergl",
          mode: "lines",
          xaxis: "x",
          yaxis: "y10",
          marker: { color: "#0abac9" },
        },
        {
          x: modelData.deltaH.x,
          y: modelData.deltaH.y,
          name: "Delta H",
          type: "scattergl",
          mode: "lines",
          xaxis: "x",
          yaxis: "y11",
          marker: { color: "#0abac9" },
        },
      ]);
    }, [modelData, modelMidpoints]);

    useEffect(() => {
      setLayout({
        autosize: true,
        title: "Flowline",
        dragmode: "pan",
        grid: {
          rows: 11,
          columns: 1,
          subplots: [
            ["xy"],
            ["xy2"],
            ["xy3"],
            ["xy4"],
            ["xy5"],
            ["xy6"],
            ["xy7"],
            ["xy8"],
            ["xy9"],
            ["xy10"],
            ["xy11"],
          ],
        },
        xaxis: {
          title: "Distance Along Centerline in Meters",
          rangemode: "tozero",
        },
        yaxis: {
          title: "Elevation (m)",
          rangemode: "tozero",
          range: [0, 1500],
        },
        yaxis2: {
          title: {
            text: "Mass balance Flux (m²)",
          },
          rangemode: "tozero",
        },
        yaxis3: {
          title: {
            text: "Diffusivity (down)",
          },
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
        yaxis6: {
          title: {
            text: "Lateral Flux",
          },
        },
        yaxis7: {
          title: {
            text: "Flux (total)",
          },
        },
        yaxis8: {
          title: {
            text: "Diffusivity",
          },
        },
        yaxis9: {
          title: {
            text: "Slope",
          },
        },
        yaxis10: {
          title: {
            text: "Flux",
          },
        },
        yaxis11: {
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
        <div className="btn-group">
          <button onClick={doModelRun} className="btn btn-lg btn-primary">
            Start
          </button>
          <button onClick={doModelStop} className="btn btn-lg btn-secondary">
            Stop
          </button>
        </div>
        <p>{`${modelTime} years`}</p>
        <Plot
          onInitialized={handleUpdate}
          onUpdate={handleUpdate}
          revision={revision}
          style={{ width: "100%", height: "1800px" }}
          data={data}
          layout={layout}
          config={config}
        />
      </div>
    );
  }
);
