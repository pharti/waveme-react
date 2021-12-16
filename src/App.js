import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import './App.css';
import contractABI from './utils/WavePortal.json'

const contractAddress = "0x473a62c4c93D70FDdCE91eCDB48aFA008A4eB836";
const abi = contractABI.abi;

export default function App() {
  /*
  * This runs our function when the page loads.
  */
  /*
 * Just a state variable we use to store our user's public wallet.
 */
  const [currentAccount, setCurrentAccount] = useState("");
  const [allWaves, setAllWaves] = useState([]);
  const [totalWave, setTotalWave] = useState(0);
  const [loader, setLoader] = useState(false);

  useEffect(() => {
    checkIfWalletIsConnected();
  }, [])

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
        connectWallet();
      }
      /*
      * Check if we're authorized to access the user's wallet
      */
      const accounts = await ethereum.request({ method: 'eth_accounts' });
      console.log('accounts', accounts);
      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
      } else {
        console.log("No authorized account found")
      }
    } catch (error) {
      console.log(error);
    }
  }

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
      getAllWavesData();

      //Access Contract.
      const contract = await accessContract();

      let count = await contract.getTotalWaves();
      console.log("Retrieved total wave count...", count.toNumber());
      setTotalWave(count.toNumber());

    } catch (error) {
      console.log(error)
    }
  }

  const wave = async () => {
    try {
      setLoader(true);
      const contract = await accessContract();
      /*
      * Execute the actual wave from your smart contract
      */
      //Access Contract.
      const waveTxn = await contract.wave("this is a message");
      console.log("Mining...", waveTxn.hash);

      await waveTxn.wait();
      console.log("Mined -- ", waveTxn.hash);

      setLoader(false);
      let count = await contract.getTotalWaves();
      console.log("Retrieved total wave count...", count.toNumber());

      setTotalWave(count.toNumber());
      getAllWavesData();
    } catch (error) {
      console.log(error)
    }
  }

  /*
 * Create a method that gets all waves from your contract
 */
  const getAllWavesData = async () => {
    try {
      const contract = await accessContract();
      /*
       * Call the getAllWaves method from your Smart Contract
       */
      const waves = await contract.getAllWaves();
      /*
       * We only need address, timestamp, and message in our UI so let's
       * pick those out
       */
      let wavesCleaned = [];
      waves.forEach(wave => {
        wavesCleaned.push({
          address: wave.waver,
          timestamp: new Date(wave.timestamp * 1000),
          message: wave.message
        });
      });

      /*
       * Store our data in React State
       */
      setAllWaves(wavesCleaned);

    } catch (error) {
      console.log(error);
    }
  }

  const accessContract = () => {
    const { ethereum } = window;
    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const wavePortalContract = new ethers.Contract(contractAddress, abi, signer);
      return wavePortalContract;
    } else {
      console.log("Ethereum object doesn't exist!")
    }
  }

  return (
    <>
      {loader && <div className='loaderView'><div className="loader"></div></div>}

      <div className="mainContainer">
        <div className="dataContainer">
          <div className="header">
            👋 Hey there!
          </div>

          <div className="bio">
            I am Amit and I made this with help of farza, isn't this stuff so cool? Connect your Ethereum wallet and wave at me!
          </div>
          <div className="waveCount">
            <p className="waveCountTitle">
              Total Waves: {totalWave}
            </p>
          </div>
          <button className="waveButton" onClick={wave}>
            Wave at Me
          </button>
          {allWaves && allWaves.map((wave, index) => {
            return (
              <div key={index} style={{ backgroundColor: "OldLace", marginTop: "16px", padding: "8px" }}>
                <div>Address: {wave.address}</div>
                <div>Time: {wave.timestamp.toString()}</div>
                <div>Message: {wave.message}</div>
              </div>)
          })}
        </div>
      </div>
    </>
  );
}