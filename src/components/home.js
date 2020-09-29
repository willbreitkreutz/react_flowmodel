import React from "react";
import Chart from "./chart";

export default () => {
  return (
    <div className="container-fluid">
      <h2>Shallow Ice Approximation Flow Model</h2>
      <Chart />
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
