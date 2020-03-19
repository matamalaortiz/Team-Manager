import React, { Component } from "react";
import Outside from "./components/Outside/Outside";
import Inside from "./components/Inside/Inside";
import { Route, Switch } from "react-router";
import Toolbar from "./components/Inside/Navigation/Toolbar/Toolbar";
import Footer from "./components/Inside/Navigation/Footer/Footer";
import Layout from "./hoc/Layout/Layout";

class App extends Component {
  state = {};
  render() {
    return (
      <div>
        <Toolbar />
        <Layout>
          <Switch>
            <Route path="/my-teams" component={Inside} />
            <Route path="/" component={Outside} />1
          </Switch>
        </Layout>
        <Footer />
      </div>
    );
  }
}

export default App;
