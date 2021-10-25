import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, transformCharacterData } from '../../constants';
import LoadingIndicator from '../LoadingIndicator';

import roshambo from '../../contracts/Roshambo.json';
import './Arena.css';



/*
 * We pass in our characterNFT metadata so we can a cool card in our UI
 */
const Arena = ({ characterNFT, setCharacterNFT, account }) => {

  const plays = ['🪨', ' 📃', '✂️'];
  // State
  const [gameContract, setGameContract] = useState(null);
  const [boss, setBoss] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastTurn, setLastTurn] = useState();
  const [allNFTs, setAllNFTs] = useState({});
  
  
  // UseEffects
  useEffect(() => {
    const fetchAllNFTs = async () => {
      console.log('in fetchAllNFTs');
      try {
        const myNFT = await gameContract.tokenID();
        const myTokenID = myNFT.toNumber();
        console.log("MyNFT: ", myNFT);
        const result = await gameContract.numTokens();
        const top = result.toNumber();
        console.log("Top: ", top);
        for (let i = 1; i < top; i++) {
          if (i !== myTokenID) {
            const txn = await gameContract.tokenURI(i);
            const json = atob(txn.substring(29));
            const nft = await JSON.parse(json);
            setAllNFTs(prev => ({...prev, [i.toString()]: nft}));
          }
        }
      } catch(error) {
        console.log(error);
      }
    }


	  const fetchBoss = async () => {
	    const bossTxn = await gameContract.getBigBoss();
			console.log('Boss:', bossTxn);
	    setBoss(transformCharacterData(bossTxn));
	  };

    const onCharacterMint = async (_sender, tokenId, _characterIndex) => {
      try {
          const myNFT = await gameContract.tokenID();
          const myTokenID = myNFT.toNumber();
          if (tokenId === myTokenID) 
            return;
          const txn = await gameContract.tokenURI(tokenId);
          console.log(txn);
          const json = atob(txn.substring(29));
          const nft = await JSON.parse(json);
          setAllNFTs(prev => ({...prev, [tokenId.toString()]: nft}));
        } catch(err) {
          console.log(err);
        }
    }
		
		/*
		* Setup logic when this event is fired off
		*/
		const onTurnComplete = async (sender, tokenId, newBossBankroll, newPlayerBankroll, newBossPlayed, newPlayerPlayed) => {
      console.log(`sender ${sender} with token ${tokenId}`);
      if (sender.toUpperCase() !== account.toUpperCase()) {
        console.log(`sender ${sender} is not equal to account ${account}`);
  	    const bossBankroll = newBossBankroll.toNumber();
        setBoss((prevState) => {
          return { ...prevState, bankroll: bossBankroll };
        });
        try {
          const txn = await gameContract.tokenURI(tokenId);
          console.log(txn);
          const json = atob(txn.substring(29));
          const nft = await JSON.parse(json);
          setAllNFTs(prev => ({...prev, [tokenId.toString()]: nft}));
        } catch(err) {
          console.log(err);
        }
        return;
      }
	    const bossBankroll = newBossBankroll.toNumber();
	    const playerBankroll = newPlayerBankroll.toNumber();
      const bossPlayed = newBossPlayed.toNumber();
      const playerPlayed = newPlayerPlayed.toNumber();
	
	    try {
      setLastTurn(`Boss played ${plays[bossPlayed]} You played ${plays[playerPlayed]}`);
	
		  /*
		   * Update both player and boss Hp
		   */
	    setBoss((prevState) => {
	      return { ...prevState, bankroll: bossBankroll };
	    });
	
	    setCharacterNFT((prevState) => {
	      return { ...prevState, bankroll: playerBankroll };
	    });
      setIsLoading(false);
      } catch (err) {
        console.log(err);
        setIsLoading(false);
      }

 
	  };
	
	  if (gameContract) {
      fetchAllNFTs();
	    fetchBoss();
			gameContract.on('TurnComplete', onTurnComplete);
      gameContract.on('CharacterNFTMinted', onCharacterMint);
      console.log('set onTurnComplete!')
	  }
	
	/*
	* Make sure to clean up this event when this component is removed
	*/
	 return () => {
	  if (gameContract) {
      fetchAllNFTs();
	    gameContract.off('TurnComplete', onTurnComplete);
      gameContract.off('CharacterNFTMinted', onCharacterMint);
	  }
	}
}, [gameContract, setCharacterNFT]);

  // UseEffects
  useEffect(() => {
    
    const { ethereum } = window;

    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const gameContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        roshambo.abi,
        signer
      );
      setGameContract(gameContract);
    } else {
      console.log('Ethereum object not found');
    }
    

  }, []);

  const roshamboTurn = async (play) => {
    setIsLoading(true);
    const txn = await gameContract.play(play, 5, Date.now());
    await txn.wait();
    console.log('did something: ', txn);
    setIsLoading(false);
  };


  return (
  <div className="arena-container">
    {/* Replace your Boss UI with this */}
    {boss && (
      <div className="boss-container">
        <div className={`boss-content`}>
          <h2>🔥 {boss.name} 🔥</h2>
          <div className="image-content">
            <img src={`https://cloudflare-ipfs.com/ipfs/${boss.imageURI}`} alt={`Boss ${boss.name}`} />
            <div className="health-bar">
              <progress value={boss.bankroll} max={boss.maxBankroll} />
              <p>{`${boss.bankroll} / ${boss.maxBankroll} Bankroll`}</p>
            </div>
          </div>
        </div>
        <div className="attack-container">
          <button className="cta-button" onClick={() => roshamboTurn(0)}>
            {`🪨 Attack ${boss.name}`}
          </button>
          <button className="cta-button" onClick={() => roshamboTurn(1)}>
            {`📃 Attack ${boss.name}`}
          </button>
          <button className="cta-button" onClick={() => roshamboTurn(2)}>
            {`✂️ Attack ${boss.name}`}
          </button>
        </div>
      </div>
    )}
    {!!isLoading && (
        <LoadingIndicator />
    )}
    {!!lastTurn && (
      <h2>{lastTurn}</h2>
    )}
    {/* Character NFT */}
    {characterNFT && (
      <div className="players-container">
        <div className="player-container">
          <h2>Your Character</h2>
          <div className="player">
            <div className="image-content">
              <h2>{characterNFT.name}</h2>
              <img src={`https://cloudflare-ipfs.com/ipfs/${characterNFT.imageURI}`}
                alt={`Character ${characterNFT.name}`}
              />
              <div className="health-bar">
                <progress value={characterNFT.bankroll} max={characterNFT.maxBankroll} />
                <p>{`${characterNFT.bankroll} / ${characterNFT.maxBankroll} Bankroll`}</p>
              </div>
            </div>
          </div>
        </div>
        {Object.keys(allNFTs).map((id) => (
          <div className="player-container" key={id}>
          
          <div className="player">
            <div className="image-content">
              <h2>{allNFTs[id].name}</h2>
              <img src={`https://cloudflare-ipfs.com/ipfs/${allNFTs[id].image.substring(7)}`}
                alt={`Character ${allNFTs[id].name}`}
              />
              <div className="health-bar">
                <progress value={allNFTs[id].attributes[0].value} max={allNFTs[id].attributes[0].max_value} />
                <p>{`${allNFTs[id].attributes[0].value} / ${allNFTs[id].attributes[0].max_value} Bankroll`}</p>
              </div>
            </div>
           </div>
          </div>
           ))}
      </div>
    )}
    
  </div>
);
};

export default Arena;

// "attributes": [ { "trait_type": "Bankroll", "value": 510, "max_value":500} ]}