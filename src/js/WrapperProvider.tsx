import React, { useState, useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { App } from "./App";
import { WalletCreate } from "./WalletCreate";

export function WrapperProvider() {
  const [isLogedIn, setIsLogedIn] = useState("0");
  useEffect(() => {}, [isLogedIn]);
  return (
    <Routes>
      <Route path="/" element={<App />}>
        <Route path="/" element={<WalletCreate />} />
      </Route>
    </Routes>
  );
}
