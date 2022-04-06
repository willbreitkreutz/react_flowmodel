import React from "react";
import { connect } from "redux-bundler-react";

export default connect("selectRoute", ({ route: Route }) => {
  return <Route />;
});
