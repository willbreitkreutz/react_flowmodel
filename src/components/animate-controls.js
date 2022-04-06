import React from "react";
import { connect } from "redux-bundler-react";

export default connect(
  "doAnimateForward",
  "doAnimateBack",
  "doAnimatePlay",
  "doAnimateStop",
  "doAnimateSetFrame",
  "selectAnimateCurrentFrame",
  "selectAnimateRunLength",
  "selectAnimateCurrentRun",
  ({
    doAnimateForward,
    doAnimateBack,
    doAnimatePlay,
    doAnimateStop,
    doAnimateSetFrame,
    animateCurrentFrame: frame,
    animateRunLength: length,
    animateCurrentRun: run,
  }) => {
    return (
      <div className="mt-3 mb-3">
        <div className="row">
          <div className="col-6">
            <div className="btn-group mb-2">
              <button
                disabled={!run}
                onClick={doAnimateBack}
                className="btn btn-lg btn-primary"
              >
                <i className="mdi mdi-chevron-left"></i>
              </button>
              <button
                disabled={!run}
                onClick={doAnimatePlay}
                className="btn btn-lg btn-primary"
              >
                Play
              </button>
              <button
                disabled={!run}
                onClick={doAnimateStop}
                className="btn btn-lg btn-primary"
              >
                Stop
              </button>
              <button
                disabled={!run}
                onClick={doAnimateForward}
                className="btn btn-lg btn-primary"
              >
                <i className="mdi mdi-chevron-right"></i>
              </button>
            </div>
            <input
              disabled={!run}
              style={{ width: "100%" }}
              type="range"
              min={0}
              max={length}
              value={frame || 0}
              onChange={(el) => {
                const newFrame = el.target.value;
                doAnimateSetFrame(newFrame);
              }}
            />
          </div>
        </div>
      </div>
    );
  }
);
