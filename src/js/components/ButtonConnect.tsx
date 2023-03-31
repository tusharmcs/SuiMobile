import { useState } from "react";
import { useWallet } from "@mysten/wallet-adapter-react";

export function ButtonConnect() {
  const [error, setError]: any[] = useState(null);
  const [showWallets, setShowWallets] = useState(false);

  const { wallets, connected, select, disconnect } = useWallet();

  const handleShowWallets = () => {
    if (wallets.length == 0) {
      const linkSui =
        "https://chrome.google.com/webstore/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil";
      setError(
        <div
          style={{ textAlign: "left", fontSize: "0.9em", fontStyle: "italic" }}
        >
          <p>Please install a wallet to continue:</p>
          <ul style={{ margin: "0" }}>
            <li>
              <a href={linkSui} className="rainbow" target="_blank">
                Sui Wallet
              </a>{" "}
              (official)
            </li>
          </ul>
        </div>
      );
    } else {
      setShowWallets(true);
    }
  };

  const handleConnect = (walletName: string) => {
    select(walletName);
    // console.debug("[ButtonConnect] Connecting to", walletName);
    setShowWallets(false);
  };

  const handleDisconnect = () => {
    // console.debug("[ButtonConnect] Disconnected");
    disconnect();
  };

  const WalletSelection = () => {
    return (
      <>
        {" "}
        {wallets.map((wallet) => (
          <button
            type="button"
            className="bsBtn-info unlock-wallet"
            key={wallet.name}
            onClick={() => handleConnect(wallet.name)}
          >
            <img
              src={wallet.icon}
              style={{
                width: "1.5em",
                verticalAlign: "top",
                marginRight: "0.5em",
              }}
            />
            {wallet.name}
          </button>
        ))}{" "}
      </>
    );
  };

  // const ButtonDisconnect = () => {
  //     return <button type='button' className='bsBtn-info unlock-wallet' onClick={handleDisconnect}>
  //         DISCONNECT
  //     </button>;
  // }

  const ButtonConnect = () => {
    if (showWallets) return <WalletSelection />;
    else if (connected)
      // return <ButtonDisconnect/>;
      return <></>;
    else
      return (
        <button
          type="button"
          className="bsBtn-info unlock-wallet"
          onClick={handleShowWallets}
        >
          CLICK
        </button>
      );
  };

  return error ? <>{error}</> : <ButtonConnect />;
}
