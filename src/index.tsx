import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import { WrapperProvider } from "./js/WrapperProvider";

ReactDOM.render(
  <BrowserRouter>
    <WrapperProvider />
  </BrowserRouter>,
  document.getElementById("app")
);
