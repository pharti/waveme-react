import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import './App.css';
import contractABI from './utils/WavePortal.json'
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Typography, Card, CardContent, Button, CardActions, TextField, Grid } from '@mui/material';

const contractAddress = "0xEC479ef4d88697983ECb57f8dD39B710fA494eba";
const abi = contractABI.abi;
const theme = createTheme({

});
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
  const [message, setMessage] = useState(0);

  const [loader, setLoader] = useState(false);

  useEffect(() => {
    checkIfWalletIsConnected();
    let wavePortalContract;

    const onNewWave = (from, timestamp, message) => {
      setAllWaves(prevState => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);
    };

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(contractAddress, abi, signer);
      wavePortalContract.on('NewWave', onNewWave);
    }

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off('NewWave', onNewWave);
      }
    };
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
      if (accounts.length !== 0) {
        const account = accounts[0];
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
      setCurrentAccount(accounts[0]);
      getAllWavesData();

      //Access Contract.
      const contract = await accessContract();

      let count = await contract.getTotalWaves();
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
      const waveTxn = await contract.wave(message.toString());

      await waveTxn.wait();

      setLoader(false);
      setMessage('');
      let count = await contract.getTotalWaves();

      setTotalWave(count.toNumber());
      getAllWavesData();
    } catch (error) {
      console.log(error)
      setLoader(false);
    }
  }

  /*
 * Create a method that gets all waves from your contract
 */
  const getAllWavesData = async () => {
    const { ethereum } = window;

    try {
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, abi, signer);
        const waves = await wavePortalContract.getAllWaves();

        const wavesCleaned = waves.map(wave => {
          return {
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message,
          };
        });

        setAllWaves(wavesCleaned);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
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


  const handleTextFieldChange = (e) => {
    setMessage(e.target.value);
  };

  return (
    <ThemeProvider theme={theme}>
      {loader && <div className='loaderView'><div className="loader"></div></div>}

      <div className="mainContainer">
        <div className="dataContainer">
          <Grid container alignItems='center' justifyContent='space-between' style={{ paddingBottom: 20 }}>
            <Grid item>
              <Typography variant='h4'>
                👋 Hey there!
              </Typography>
            </Grid>
            <Grid item>
              <Typography variant='caption'>
                Total Waves: {totalWave}
              </Typography>
            </Grid>
          </Grid>

          <Grid container alignItems='center' justifyContent='space-between'>
            <Grid item>
              <TextField id="outlined-basic" label="Message" variant="outlined" style={{ width: 350 }} onChange={handleTextFieldChange} />
            </Grid>
            <Grid item>
              <Button variant="contained" onClick={wave} style={{ height: 56 }}>👋  Wave</Button>
            </Grid>
          </Grid>

          {allWaves && allWaves.map((wave, index) => {
            return (
              <div style={{ paddingTop: 20 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                      Address: {wave.address}
                    </Typography>
                    <Typography variant="h5" component="div">
                      {wave.message}
                    </Typography>
                    <Typography variant="caption" sx={{ mb: 1.5 }} color="text.secondary">
                      Time: {wave.timestamp.toString()}
                    </Typography>
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>
      </div>
    </ThemeProvider>
  );
}