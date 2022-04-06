import { createSelector } from "redux-bundler";
import FlowModel from "../sia/model";
import bed from "../model/bed-filtered.json";
// import ice from "../model/decades/node-ice-100.json";

bed.reverse();

export default {
  name: "model",

  getReducer: () => {
    const initialData = {
      time: 0,
      model: null,
      interval: null,
      revision: 0,
      elements: [],
      midpoints: [],
    };
    return (state = initialData, { type, payload }) => {
      switch (type) {
        case "MODEL_INIT":
        case "MODEL_UPDATE_INTERVAL":
        case "MODEL_UPDATE_PROFILE":
          return Object.assign({}, state, payload);
        default:
          return state;
      }
    };
  },

  selectModel: (state) => {
    return state.model.model;
  },

  selectModelLength: createSelector("selectModel", (model) => {
    return model.modelLength;
  }),

  selectModelElementCount: createSelector("selectModel", (model) => {
    return model.elementCount;
  }),

  selectModelDx: createSelector("selectModel", (model) => {
    return model.dx;
  }),

  selectModelRevision: (state) => {
    return state.model.revision;
  },

  selectModelTime: (state) => {
    return state.model.time;
  },

  selectModelElements: (state) => {
    return state.model.elements;
  },

  selectModelMidpoints: (state) => {
    return state.model.midpoints;
  },

  selectModelData: createSelector(
    "selectModelElements",
    "selectModelDx",
    (elements, dx) => {
      const data = {
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
        Object.keys(data).forEach((key) => {
          data[key].x.push(x * dx);
          data[key].y.push(el[key]);
        });
      });
      return data;
    }
  ),

  selectModelMidpointData: createSelector(
    "selectModelMidpoints",
    "selectModelDx",
    (midpoints, dx) => {
      const data = {
        elementDown: { x: [], y: [] },
        elementUp: { x: [], y: [] },
        diffusivity: { x: [], y: [] },
        slope: { x: [], y: [] },
        flux: { x: [], y: [] },
      };
      midpoints.forEach((el, x) => {
        Object.keys(data).forEach((key) => {
          data[key].x.push(x * dx + 0.5 * dx);
          data[key].y.push(el[key]);
        });
      });
      return data;
    }
  ),

  doModelStop: () => ({ dispatch, store }) => {
    const model = store.selectModel();
    model.pause();
  },

  doModelUpdateChart: ({ t, elements, midpoints }) => ({ dispatch, store }) => {
    // update our charts only every year
    if (t % 1 === 0) {
      let revision = store.selectModelRevision();
      dispatch({
        type: "MODEL_UPDATE_PROFILE",
        payload: {
          time: t,
          elements,
          midpoints,
          revision: ++revision,
        },
      });
    }
  },

  doModelRun: () => ({ store }) => {
    const model = store.selectModel();
    model.start();
  },

  doModelInit: () => ({ dispatch, store }) => {
    const model = new FlowModel({
      onChange: store.doModelUpdateChart,
      iceConstructor: (i) => {
        return 0;
      },
      bedConstructor: (i) => {
        return bed[Math.round((i / 200) * bed.length)];
      },
      iterationsPerYear: 400,
    });
    dispatch({
      type: "MODEL_INIT",
      payload: {
        model: model,
      },
    });
  },

  init: (store) => {
    store.doModelInit();
  },
};
