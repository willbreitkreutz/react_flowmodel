import React from "react";
import { connect } from "redux-bundler-react";

export default connect(
  "doAnimateSelectRun",
  "selectAnimateCurrentRun",
  "selectAnimateRuns",
  ({ animateCurrentRun: currentRun, animateRuns, doAnimateSelectRun }) => {
    return (
      <div className="mt-3 mb-3">
        <div className="row">
          <div className="col-4">
            <label className="form-label">Choose model run to display:</label>
            <select
              className="form-control"
              onChange={(e) => {
                doAnimateSelectRun(e.target.value);
              }}
              value={currentRun || ""}
            >
              <option value="">Select One to load...</option>
              {animateRuns.map((run) => {
                return (
                  <option key={run} value={run}>
                    {run}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>
    );
  }
);
