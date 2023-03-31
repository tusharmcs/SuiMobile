import React, { useEffect, useState } from "react";
import { Ed25519Keypair } from "@mysten/sui.js";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SuiLogo from "../assets/img/dark_mode_sui.svg";
import { wordlist } from "@scure/bip39/wordlists/english";
import { validateMnemonic as bip39ValidateMnemonic } from "@scure/bip39";

export function WalletCreate() {
  const [showImportFrom, setShowImportForm] = useState(false);
  useEffect(() => {}, [showImportFrom]);

  return (
    <>
      <ToastContainer />
      {showImportFrom ? (
        <ImportForm setShowImportForm={setShowImportForm} />
      ) : (
        <div className="flex-wrapper">
          <img src={SuiLogo} className="layout-logo" alt="Sui Startups" />
          <p className="layout-content">
            Transform your business with AI-powered solutions. From sentiment
            analysis to IDO launchpads, we've got you covered. Experience the
            power of cutting-edge technology today.
          </p>
          <button
            className="wallet-button"
            onClick={() => setShowImportForm(true)}
          >
            Join Us
          </button>
        </div>
      )}
    </>
  );
}

function ImportForm(props: any) {
  const { setShowImportForm } = props;
  const [key, setKey] = useState("");
  const [importWords, setImportWords] = useState("");
  const [showWallet, setShowWallet] = useState(false);
  const toastMsg = (data: any) =>
    toast(data, {
      position: "top-left",
      autoClose: 1000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "dark",
    });
  const importWallet = () => {
    if (importWords !== "") {
      const TEST_MNEMONICS = importWords;
      if (
        bip39ValidateMnemonic(TEST_MNEMONICS, wordlist) &&
        (TEST_MNEMONICS.split(" ") || []).length === 12
      ) {
        const keypair_ed25519 = Ed25519Keypair.deriveKeypair(
          TEST_MNEMONICS,
          "m/44'/784'/0'/0'/0'"
        );
        const publicKey = keypair_ed25519.getPublicKey().toSuiAddress();
        setKey(publicKey);
        setShowWallet(true);
        toastMsg("Imported Successfully.");
      } else {
        toastMsg("There is no wallet related to those mnemonic");
      }
    } else {
      toastMsg("Something went wrong");
    }
  };

  return (
    <div className="flex-wrapper">
      <ToastContainer />
      {showWallet ? (
        <>
          <h4>Sui Startups!!</h4>
          <p>{`0x${key}`}</p>
        </>
      ) : (
        <>
          <p className="layout-content">
            Import your existing wallet by entering the 12-word recovery phrase.
          </p>
          <input
            type="text"
            className="form-control"
            placeholder="Mnemonic"
            value={importWords}
            onChange={(e) => setImportWords(e.target.value)}
          />
          <div className="import-btn-wrapper">
            <button
              className="wallet-button"
              onClick={() => setShowImportForm(false)}
            >
              Back
            </button>
            <button className="wallet-button" onClick={() => importWallet()}>
              Import Wallet
            </button>
          </div>
        </>
      )}
    </div>
  );
}
