import React, { useEffect, useState } from "react";
import { connect } from "redux-bundler-react";
import Plot from "react-plotly.js";

export default connect(
  "doModelRun",
  "doModelStop",
  "selectModelMassBalanceSeries",
  "selectModelSeries",
  "selectModelRevision",
  ({
    doModelRun,
    doModelStop,
    modelMassBalanceSeries: massBalance,
    modelSeries,
    modelRevision: revision,
  }) => {
    const [data, setData] = useState([]);
    const [layout, setLayout] = useState({});
    const [config, setConfig] = useState({});

    useEffect(() => {
      setData([
        {
          x: modelSeries.x,
          y: modelSeries.y,
          name: "Thickness",
          type: "scattergl",
          mode: "lines",
          marker: { color: "blue" },
        },
        {
          x: massBalance.x,
          y: massBalance.y,
          name: "Mass Balance",
          type: "scattergl",
          mode: "lines",
          xaxis: "x",
          yaxis: "y2",
        },
      ]);
    }, [modelSeries, massBalance]);

    useEffect(() => {
      setLayout({
        autosize: true,
        title: "Flowline",
        dragmode: "pan",
        xaxis: {
          title: "Distance Along Centerline in Model Columns",
          rangemode: "tozero",
        },
        yaxis: {
          title: "Thickness in Meters",
          rangemode: "tozero",
          range: [0, 1500],
        },
        yaxis2: {
          title: {
            text: "Mass Balance M/yr",
          },
          side: "right",
          rangemode: "tozero",
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
        <p>{`${revision} years`}</p>
        <Plot
          onInitialized={handleUpdate}
          onUpdate={handleUpdate}
          revision={revision}
          style={{ width: "100%", height: "400px" }}
          data={data}
          layout={layout}
          config={config}
        />
      </div>
    );
  }
);
