import React from "react";
import { render } from "@testing-library/react";
import App from "../App";
import { BrowserRouter } from "react-router-dom";
import { AppProviders } from "../providers";

test("renders the app without crashing", () => {
  render(
    <BrowserRouter>
      <AppProviders>
        <App />
      </AppProviders>
    </BrowserRouter>
  );
});
