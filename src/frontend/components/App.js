
import logo from './logo.jpg';
import './App.css';

//allows us to talk to ethereum node etherrs connects 2 metamask
import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import MarketplaceAbi from '../contractsData/Marketplace.json'
import MarketplaceAddress from '../contractsData/Marketplace-address.json'
import NFTAbi from '../contractsData/NFT.json'
import NFTAddress from '../contractsData/NFT-address.json'
import Navigation from './Navbar';
import NftByBarterAbi from '../contractsData/NftByBarter.json'
import NftByBarterAddress from '../contractsData/NftByBarter-address.json'
import { Spinner } from 'react-bootstrap'

import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import Home from './Home.js'
import Create from './Create.js'
import MyListedItems from './MyListedItems.js'
import MyPurchases from './MyPurchases.js'



function App() {
  const [loading, setLoading] = useState(true)
  const [account, setAccount] = useState(null)
  const [nft, setNFT] = useState({})
  const [marketplace, setMarketplace] = useState({})
  const [nftbybarter, setNftByBarter] = useState({})
  // MetaMask Login/Connect
  const web3Handler = async () => {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0])
      // Get provider from Metamask
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      // Set signer
      const signer = provider.getSigner()
  
      window.ethereum.on('chainChanged', (chainId) => {
        window.location.reload();
      })
  
      window.ethereum.on('accountsChanged', async function (accounts) {
        setAccount(accounts[0])
        await web3Handler()
      })
      loadContracts(signer)
    }

    const loadContracts = async (signer) => {
      // Get deployed copies of contracts
      const marketplace = new ethers.Contract(MarketplaceAddress.address, MarketplaceAbi.abi, signer)
      setMarketplace(marketplace)
      const nft = new ethers.Contract(NFTAddress.address, NFTAbi.abi, signer)
      setNFT(nft)
      const nftbybarter = new ethers.Contract(NftByBarterAddress.address, NftByBarterAbi.abi, signer)
      setNftByBarter(nftbybarter)
      setLoading(false)
    }

 
  return (
    <BrowserRouter>
    <div className="App">
      <>
        <Navigation web3Handler={web3Handler} account={account} />
      </>
      <div>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <Spinner animation="border" style={{ display: 'flex' }} />
            <p className='mx-3 my-0'>Awaiting Metamask Connection...</p>
          </div>
        ) : (
          <Routes>
            <Route path="/" element={
              <Home marketplace={marketplace} nft={nft} />
            } />
            <Route path="/create" element={
              <Create marketplace={marketplace} nft={nft} />
            } />
            <Route path="/my-listed-items" element={
              <MyListedItems nftbybarter={nftbybarter} nft={nft} account={account} />
            } />
            <Route path="/my-purchases" element={
              <MyPurchases marketplace={marketplace} nft={nft} account={account} />
            } />
            
           
           
          </Routes>
        )}
      </div>
    </div>
  </BrowserRouter>

  );
}

export default App;
