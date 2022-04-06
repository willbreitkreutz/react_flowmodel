import React from "react";
import AnimateControls from "./animate-controls";
import ComparisonChart from "./comparison-chart";

export default () => {
  return (
    <div className="container-fluid">
      <div
        style={{
          position: "fixed",
          top: 0,
          width: "50%",
          zIndex: 9999,
          backgroundColor: "rgba(255,255,255,0.5)",
        }}
      >
        <h2>Model Intercomparison</h2>
        <AnimateControls />
      </div>
      <div style={{ marginTop: "250px" }}></div>
      <ComparisonChart />
    </div>
  );
};
