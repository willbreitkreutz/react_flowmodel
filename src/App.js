import React from "react";
import { Provider } from "redux-bundler-react";
import Home from './components/home'

class App extends React.Component {
  render() {
    const { store } = this.props;
    return (
      <Provider store={store}>
        <Home />
      </Provider>
    );
  }
}

export default App;
