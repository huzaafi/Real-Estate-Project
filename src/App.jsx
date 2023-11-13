import { useState, useEffect } from 'react'
import { ethers } from 'ethers'

// Components
import Navigation from './components/Navigation';
import Search from './components/Search';
import Home from './components/Home';

// ABIs
import RealEstate from './abis/RealEstate.json';
import Escrow from './abis/Escrow.json'

// Config.json
import config from './config.json'


function App() {
  const [provider, setProvider] = useState(null)
  const [escrow, setEscrow] = useState(null)
  const [homes, setHomes] = useState(null)
  const [toggle, setToggle] = useState(false)
  const [home, setHome] = useState(null)
  const [account, setAccount] = useState(null)
  
  const loadBlockchainData = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    // console.log(provider)
    setProvider(provider)


    const network = await provider.getNetwork()
    
    const realEstate = new ethers.Contract(config[network.chainId].realEstate.address, RealEstate, provider)
    const totalSupply = await realEstate.totalSupply()
    // console.log(totalSupply.toString())
    // console.log(config[network.chainId].realEstate.address, config[network.chainId].escrow.address)
    const homes = []

    for (var i = 1; i <= totalSupply; i++) {
      const uri = await realEstate.tokenURI(i)
      const response = await fetch(uri)
      const metadata = await response.json()
      homes.push(metadata)
    }

    setHomes(homes)
    // console.log(homes)
    

    const escrow = new ethers.Contract(config[network.chainId].escrow.address, Escrow, provider)
    setEscrow(escrow)

    window.ethereum.on('accountsChanged', async () => {
      const accounts = await window.ethereum.request({method: 'eth_requestAccounts'});
      const account = ethers.utils.getAddress(accounts[0]);
      setAccount(account);
    })
  }

  useEffect(() => {
    loadBlockchainData();
  }, [])

  const togglePop = (home) => {
    setHome(home)
    toggle ? setToggle(false) : setToggle(true)
  }

  return (
    <>
      <Navigation account={account} setAccount={setAccount} />
      <Search />  

      <div className='cards__section'>
        <h3>Homes For You</h3>
        <hr />
        <div className='cards'>
          {homes && homes.map((home, index) => (
            <div className='card' key={index} onClick={() => togglePop(home)}>
              <div className='card__image'>
                <img src={home.image} alt='img' />
              </div>  
              <div className='card__info'>
                <h4> {home.attributes[0].value} ETH </h4>
                <strong>{home.attributes[3].value}</strong> bed |
                <strong>{home.attributes[4].value}</strong> bath |
                <strong>{home.attributes[5].value}</strong> sqft 
                <address> {home.address} </address>
              </div>
            </div>
          ))}
        </div>
      </div>

      {toggle && (
        <Home home={home} provider={provider} account={account} escrow={escrow} togglePop={togglePop} />
      )}
    </>
  )
}

export default App
