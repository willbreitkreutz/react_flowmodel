import React from "react";
import { Provider } from "redux-bundler-react";
import MainContainer from "./components/main-container";

class App extends React.Component {
  render() {
    const { store } = this.props;
    return (
      <Provider store={store}>
        <MainContainer />
      </Provider>
    );
  }
}

export default App;
