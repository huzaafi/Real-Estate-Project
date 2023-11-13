import { ethers } from 'ethers'
import logo from '../assets/logo.svg'

const Navigation = ({account, setAccount}) => {
    const connectHandler = async() => {
        const accounts = await window.ethereum.request({method: 'eth_requestAccounts'})
        // console.log(accounts[0])
        setAccount(accounts[0])
    }

    return <>
        <nav>
            <ul className='nav__links'>
                <li><a hre='#'>Rent </a></li>
                <li><a hre='#'>Buy </a></li>
                <li><a hre='#'>Sell </a></li>
            </ul>

            <div className='nav__brand'>
                <img src={logo} alt='HRS Logo' />
            </div>

            {account ? (
                <button type='button' className='nav__connect'>
                    {account.slice(0, 6) + "..." + account.slice(38, 42)}
                </button>
            ) : (
                <button className='nav__connect' onClick={connectHandler}>
                Connect
                </button>
            )}
            
        </nav>
    </>
}

export default Navigation;