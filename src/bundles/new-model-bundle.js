import { createSelector } from "redux-bundler";
import start from "../components/model";

const col = 100;
const massBalanceQuantity = 0.3; // m/yr
const massBalance = [];
for (var i = 0; i < col; i++) {
  const x = i;
  // linear
  // const y = (-2 / col) * x + 1;
  // exponential
  const y = 2 - (x / (0.6 * col)) ** 3;
  massBalance[i] = y * massBalanceQuantity;
}

export default {
  name: "model",

  getReducer: () => {
    const initialData = {
      interval: null,
      revision: 0,
      profile: {},
      massBalance: massBalance,
    };
    return (state = initialData, { type, payload }) => {
      switch (type) {
        case "MODEL_UPDATE_INTERVAL":
        case "MODEL_UPDATE_PROFILE":
          return Object.assign({}, state, payload);
        default:
          return state;
      }
    };
  },

  selectModelRevision: (state) => {
    return state.model.revision;
  },

  selectModelProfile: (state) => {
    return state.model.profile;
  },

  selectModelSeries: createSelector("selectModelProfile", (profile) => {
    const data = {
      x: [],
      y: [],
    };
    Object.keys(profile).forEach((i) => {
      data.x.push(i);
      data.y.push(profile[i]);
    });
    return data;
  }),

  selectModelInterval: (state) => {
    return state.model.interval;
  },

  selectModelMassBalance: (state) => {
    return state.model.massBalance;
  },

  selectModelMassBalanceSeries: createSelector(
    "selectModelMassBalance",
    (massBalanceData) => {
      const data = {
        x: [],
        y: [],
      };
      massBalanceData.forEach((i, idx) => {
        data.x.push(idx);
        data.y.push(i * massBalanceQuantity);
      });
      return data;
    }
  ),

  doModelStop: () => ({ dispatch, store }) => {
    const interval = store.selectModelInterval();
    window.clearInterval(interval);
    dispatch({
      type: "MODEL_UPDATE_INTERVAL",
      payload: {
        interval: null,
      },
    });
  },

  doModelUpdateProfile: (profile) => ({ dispatch, store }) => {
    let revision = store.selectModelRevision();
    dispatch({
      type: "MODEL_UPDATE_PROFILE",
      payload: {
        profile: profile,
        revision: ++revision,
      },
    });
  },

  doModelRun: () => ({ dispatch, store }) => {
    const interval = start(store.doModelUpdateProfile);
    dispatch({
      type: "MODEL_UPDATE_INTERVAL",
      payload: {
        interval: interval,
      },
    });
  },
};
