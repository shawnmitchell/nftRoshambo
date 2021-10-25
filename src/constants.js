const CONTRACT_ADDRESS = '0x8AF286B0a4bbe9b2D436007312DBb3c636da3410';

const transformCharacterData = (characterData) => {
  return {
    name: characterData.name,
    imageURI: characterData.imageURI,
    bankroll: characterData.bankroll.toNumber(),
    maxBankroll: characterData.maxBankroll.toNumber(),
  };
};

export { CONTRACT_ADDRESS, transformCharacterData };
