import React from "react";
import ModelSelector from "./model-selector";
import AnimateControls from "./animate-controls";
import AnimatedChart from "./animated-chart";

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
        <h2>Shallow Ice Approximation Flow Model</h2>
        <small>
          <a href="/compare">Comparison</a>
        </small>
        <ModelSelector />
        <AnimateControls />
      </div>
      <div style={{ marginTop: "250px" }}></div>
      <AnimatedChart />
      {/* <Chart /> */}
      <h5>References</h5>
      <p>
        <small className="text-muted">
          Van der Veen. Fundamentals of glacier dynamics. Boca Raton, FL: CRC
          Press, 2013.
        </small>
      </p>
      <p>
        <small className="text-muted">
          Huybrechts, P., & Payne, T. (1996). The EISMINT benchmarks for testing
          ice-sheet models. Annals of Glaciology, 23, 1–12.
          https://doi.org/10.1017/S0260305500013197
        </small>
      </p>
      <p>
        <small className="text-muted">
          Cuffey, K. M., and W. S. B. Paterson. The physics of glaciers.
          Burlington, MA: Butterworth-Heinemann/Elsevier, 2010.
        </small>
      </p>
    </div>
  );
};
