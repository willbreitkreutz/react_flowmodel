import { createSelector } from "redux-bundler";

export default {
  name: "animate",

  getReducer: () => {
    const initialData = {
      timer: null,
      runs: [],
      currentRun: null,
      frames: [],
      currentFrame: null,
      loading: false,
      shouldLoadFrames: false,
      shouldLoadFrameData: false,
    };
    return (state = initialData, { type, payload }) => {
      switch (type) {
        case "MODEL_ANIMATION_UPDATE":
          return Object.assign({}, state, payload);
        default:
          return state;
      }
    };
  },

  selectAnimateState: (state) => {
    return state.animate;
  },

  selectAnimateTimer: (state) => {
    return state.animate.timer;
  },

  selectAnimateRuns: (state) => {
    return state.animate.runs;
  },

  selectAnimateCurrentRun: (state) => {
    return state.animate.currentRun;
  },

  selectAnimateFrames: (state) => {
    return state.animate.frames;
  },

  selectAnimateCurrentFrame: (state) => {
    return state.animate.currentFrame;
  },

  selectAnimateFrameData: (state) => {
    return state.animate.frameData;
  },

  selectAnimateRunLength: createSelector("selectAnimateFrames", (frames) => {
    return frames.length;
  }),

  selectAnimateCurrentData: createSelector(
    "selectAnimateState",
    "selectAnimateCurrentFrame",
    "selectAnimateFrames",
    (state, currentFrame, frames) => {
      if (currentFrame === null) return null;
      const dataframe = state[frames[currentFrame]];
      if (!dataframe) return null;
      const { i, t, elements, midpoints } = dataframe;

      const modelData = {
        iceElevation: { x: [], y: [] },
        bedElevation: { x: [], y: [] },
        diffusivity_up: { x: [], y: [] },
        flux_up: { x: [], y: [] },
        diffusivity_down: { x: [], y: [] },
        flux_down: { x: [], y: [] },
        totalFlux: { x: [], y: [] },
        massBalanceFlux: { x: [], y: [] },
        deltaH: { x: [], y: [] },
      };
      elements.forEach((el, x) => {
        Object.keys(modelData).forEach((key) => {
          modelData[key].x.push(x);
          modelData[key].y.push(el[key]);
        });
      });

      const modelMidpoints = {
        elementDown: { x: [], y: [] },
        elementUp: { x: [], y: [] },
        diffusivity: { x: [], y: [] },
        slope: { x: [], y: [] },
        flux: { x: [], y: [] },
      };
      midpoints.forEach((el, x) => {
        Object.keys(modelMidpoints).forEach((key) => {
          modelMidpoints[key].x.push(x);
          modelMidpoints[key].y.push(el[key]);
        });
      });
      return { i, t, modelData, modelMidpoints };
    }
  ),

  doAnimateGetRuns: () => ({ dispatch }) => {
    fetch("http://localhost:3030/runs")
      .then((response) => {
        return response.json();
      })
      .then((runs) => {
        dispatch({
          type: "MODEL_ANIMATION_UPDATE",
          payload: {
            runs,
          },
        });
      });
  },

  doAnimateLoadFrames: () => ({ dispatch, store }) => {
    dispatch({
      type: "MODEL_ANIMATION_UPDATE",
      payload: {
        shouldLoadFrames: false,
        loading: true,
      },
    });
    const run = store.selectAnimateCurrentRun();
    if (run) {
      fetch(`http://localhost:3030/runs/${run}/list`)
        .then((response) => {
          return response.json();
        })
        .then((frames) => {
          dispatch({
            type: "MODEL_ANIMATION_UPDATE",
            payload: {
              frames,
              shouldLoadFrameData: true,
              loading: false,
            },
          });
        });
    }
  },

  doAnimateLoadFrameData: () => ({ dispatch, store }) => {
    dispatch({
      type: "MODEL_ANIMATION_UPDATE",
      payload: {
        shouldLoadFrameData: false,
        loading: true,
      },
    });
    const run = store.selectAnimateCurrentRun();
    const frames = store.selectAnimateFrames();
    const requests = [];
    frames.forEach((frame) => {
      requests.push(
        fetch(`http://localhost:3030/${run}/${frame}`)
          .then((response) => {
            return response.json();
          })
          .then((data) => {
            return { key: frame, data: data };
          })
      );
    });
    Promise.all(requests).then((responses) => {
      console.log("all done fetching");
      const payload = {
        loading: false,
        currentFrame: 0,
      };
      responses.forEach((r) => {
        payload[r.key] = r.data;
      });
      dispatch({
        type: "MODEL_ANIMATION_UPDATE",
        payload,
      });
    });
  },

  doAnimateSelectRun: (run) => ({ dispatch, store }) => {
    dispatch({
      type: "MODEL_ANIMATION_UPDATE",
      payload: {
        currentRun: run,
        shouldLoadFrames: true,
      },
    });
  },

  doAnimateBack: () => ({ dispatch, store }) => {
    const frame = store.selectAnimateCurrentFrame();
    const newFrame = frame > 0 ? frame - 1 : 0;
    dispatch({
      type: "MODEL_ANIMATION_UPDATE",
      payload: {
        currentFrame: newFrame,
      },
    });
  },

  doAnimateForward: () => ({ dispatch, store }) => {
    const length = store.selectAnimateRunLength();
    const frame = store.selectAnimateCurrentFrame();
    const newFrame = frame < length - 1 ? frame + 1 : 0;
    dispatch({
      type: "MODEL_ANIMATION_UPDATE",
      payload: {
        currentFrame: newFrame,
      },
    });
  },

  doAnimateSetFrame: (frame) => ({ dispatch }) => {
    dispatch({
      type: "MODEL_ANIMATION_UPDATE",
      payload: {
        currentFrame: frame,
      },
    });
  },

  doAnimatePlay: () => ({ dispatch, store }) => {
    const timer = window.setInterval(store.doAnimateForward, 100);
    dispatch({
      type: "MODEL_ANIMATION_UPDATE",
      payload: {
        timer: timer,
      },
    });
  },

  doAnimateStop: () => ({ dispatch, store }) => {
    const timer = store.selectAnimateTimer();
    if (timer) {
      window.clearInterval(timer);
      dispatch({
        type: "MODEL_ANIMATION_UPDATE",
        payload: {
          timer: null,
        },
      });
    }
  },

  reactAnimateShouldLoadFrames: (state) => {
    if (state.animate.shouldLoadFrames)
      return { actionCreator: "doAnimateLoadFrames" };
  },

  reactAnimateShouldLoadFrameData: (state) => {
    if (state.animate.shouldLoadFrameData)
      return { actionCreator: "doAnimateLoadFrameData" };
  },

  init: (store) => {
    store.doAnimateGetRuns();
  },
};
