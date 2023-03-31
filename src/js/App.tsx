import { useEffect, useMemo } from "react";
import { Outlet } from "react-router-dom";
// import { WalletProvider } from "@mysten/wallet-adapter-react";
// import { WalletStandardAdapterProvider } from "@mysten/wallet-adapter-all-wallets";
import { useNavigate } from "react-router-dom";
import { reloadClouds } from "./lib/clouds";

export function App() {
  const navigate = useNavigate();
  useEffect(() => {
    const resizeObserver = new ResizeObserver((_entries) => {
      reloadClouds();
    });
    resizeObserver.observe(document.getElementById("app") as Element);
  }, []);

  const network = "devnet";
  // Delete query string
  window.history.replaceState({}, document.title, window.location.pathname);
  // const walletAdapters = useMemo(
  //   () => [new WalletStandardAdapterProvider()],
  //   []
  // );

  return (
    <div id="page">
      <section id="main">
        <section id="content">
          <Outlet context={[network]} />
        </section>
      </section>
      <span id="secret">
        It's really hard to make something beautiful. And it's really
        worthwhile.
      </span>
    </div>
  );
}
