const CONTRACT_ADDRESS = '0xD9881358D401bfF7f2d967e0d9C34bB4f42b810c';

const transformCharacterData = (characterData) => {
  return {
    name: characterData.name,
    imageURI: characterData.imageURI,
    bankroll: characterData.bankroll.toNumber(),
    maxBankroll: characterData.maxBankroll.toNumber(),
  };
};

export { CONTRACT_ADDRESS, transformCharacterData };
